import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TipoEntrada } from '@app/core/models/tipo-entrada.model';
import { EstadoEntrada } from '@app/core/models/estado-entrada.model';
import { Categoria } from '@app/core/models/categoria.model';
import { Entrada } from '@app/core/models/entrada.model';
import { MediaItem } from '@app/core/models/media-item.model';
import { ValidationEntradaFormsService } from './srv/validation-entrada-forms.service';
import { parseAllowedDate } from '@shared/utils/date-utils';
import { FileStorageService } from '@app/core/services/file-storage.service';
import { TemporaryStorageService } from '@app/core/services/ui/temporary-storage.service';
import { LoggerService } from '@app/core/services/logger.service';
import { TranslationService } from '@app/core/services/translation.service';
import { ToastService } from '@app/core/services/ui/toast.service';
import { OPConstants } from '@app/shared/constants/op-global.constants';
import { EntradaFormStateService } from '../services/entrada-form-state.service';

@Component({
  selector: 'app-entrada-form',
  templateUrl: './entrada-form.component.html',
  styleUrls: ['./entrada-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EntradaFormStateService],
  standalone: false,
})
export class EntradaFormComponent implements OnInit, OnDestroy {
  @Input() form!: UntypedFormGroup;
  @Input() tiposEntr: TipoEntrada[] = [];
  @Input() estadosEntr: EstadoEntrada[] = [];
  @Input() categorias: Categoria[] = [];
  @Input() modoLectura = false;
  @Input() submitted = false;
  @Input() entrada?: Entrada;
  @Input() customTitle?: string;
  @Input() customSubtitle?: string;
  @Input() isEditMode = false;
  @Output() submitForm = new EventEmitter<any>();
  @Output() preview = new EventEmitter<Partial<Entrada>>();
  @Output() editar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  Editor: any = null;
  editorLoading = false;
  resetConfirmVisible = false;
  modalSeleccionVisible = false;

  private editorInstance: any;
  private contenidoStatusSub?: Subscription;
  private estadoFechaSub?: Subscription;
  private destroy$ = new Subject<void>();

  get isFullWidth() {
    return this.stateService.currentState.isFullWidth;
  }

  get isFullScreen() {
    return this.stateService.currentState.isFullScreen;
  }

  get showBackToTop() {
    return this.stateService.currentState.showBackToTop;
  }

  get showRecoveryNotification() {
    return this.stateService.currentState.showRecoveryNotification;
  }

  get temporaryData() {
    return this.stateService.currentState.temporaryData;
  }

  constructor(
    private router: Router,
    private vf: ValidationEntradaFormsService,
    private fileStorage: FileStorageService,
    private cdRef: ChangeDetectorRef,
    private temporaryStorage: TemporaryStorageService,
    private log: LoggerService,
    private translate: TranslationService,
    private toast: ToastService,
    public stateService: EntradaFormStateService
  ) {}

  ngOnInit(): void {
    this.stateService.state$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdRef.markForCheck();
    });

    this.loadEditorBuild();

    const contenidoCtrl = this.form?.get('contenido');
    if (contenidoCtrl) {
      this.contenidoStatusSub = contenidoCtrl.statusChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateEditorDisabledState();
        });
    }

    const estadoCtrl = this.form?.get('estadoEntrada');
    const fechaCtrl = this.form?.get('fechaPublicacionProgramada');

    if (estadoCtrl && fechaCtrl) {
      this.estadoFechaSub = estadoCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        fechaCtrl.updateValueAndValidity({ emitEvent: false });

        if (this.isScheduled) {
          const hasValue = !!fechaCtrl.value;
          if (!hasValue) {
            const nowPlusMargin = new Date();
            nowPlusMargin.setMinutes(nowPlusMargin.getMinutes() + 30);
            fechaCtrl.setValue(this.formatDateTimeLocal(nowPlusMargin), { emitEvent: false });
          }
        } else {
          fechaCtrl.setValue(null, { emitEvent: false });
        }
      });
    }

    window.addEventListener(OPConstants.Events.SAVE_UNSAVED_WORK, this.saveBeforeLogout.bind(this));

    window.addEventListener(
      OPConstants.Events.SAVE_FORM_DATA,
      this.saveToTemporaryStorage.bind(this)
    );

    this.checkNavigationState();
    this.stateService.checkForTemporaryData(this.isEditMode || !!this.entrada?.idEntrada);
  }

  ngOnDestroy(): void {
    this.contenidoStatusSub?.unsubscribe();
    this.estadoFechaSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();

    window.removeEventListener(
      OPConstants.Events.SAVE_UNSAVED_WORK,
      this.saveBeforeLogout.bind(this)
    );

    window.removeEventListener(
      OPConstants.Events.SAVE_WORK_BEFORE_LOGOUT,
      this.saveBeforeLogout.bind(this)
    );

    window.removeEventListener(
      OPConstants.Events.SAVE_FORM_DATA,
      this.saveToTemporaryStorage.bind(this)
    );

    const editorMain = document.querySelector('.ck-editor__main');
    if (editorMain) {
      editorMain.removeEventListener('scroll', this.onInternalScroll as any);
    }
  }

  openResetConfirm() {
    if (!this.form) return;
    if (this.form.pristine) return;
    this.resetConfirmVisible = true;
    this.cdRef.markForCheck();
  }

  onConfirmReset() {
    this.resetConfirmVisible = false;
    this.onReset();
  }

  onCancelReset() {
    this.resetConfirmVisible = false;
    this.cdRef.markForCheck();
  }

  onReset() {
    if (!this.form) {
      return;
    }

    this.form.reset();

    const arr = this.categoriasArray;
    while (arr.length !== 0) {
      arr.removeAt(0);
    }

    this.form.patchValue({ imagenDestacada: null });

    this.form.markAsPristine();
    this.form.markAsUntouched();

    this.cdRef.markForCheck();
  }

  onEditar() {
    this.editar.emit();
  }

  get categoriasArray(): UntypedFormArray {
    return this.vf.getCategoriasArray(this.form);
  }

  get imagenDestacadaUrl(): string | null {
    return (this.form?.get('imagenDestacada')?.value as string) || null;
  }

  get esPublicada(): boolean {
    const estado = (this.entrada?.estadoEntrada || this.form.get('estadoEntrada')?.value) as
      | EstadoEntrada
      | null
      | undefined;
    const nombreEstado = estado?.nombre?.toUpperCase();
    return nombreEstado === 'PUBLICADA';
  }

  get fechaPublicacionMostrar(): Date | null {
    const fuente =
      this.form.get('fechaPublicacion')?.value ?? this.entrada?.fechaPublicacion ?? null;
    if (!fuente) {
      return null;
    }
    return parseAllowedDate(fuente) || null;
  }

  get isScheduled(): boolean {
    const estado = this.form.get('estadoEntrada')?.value as EstadoEntrada | null;
    return !!estado && (estado.nombre === 'PROGRAMADA' || estado.idEstadoEntrada === 4);
  }

  get minDate(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return this.formatDateTimeLocal(now);
  }

  hasCategoria(c: Categoria): boolean {
    return this.categoriasArray?.value?.some((x: any) => x?.idCategoria === c?.idCategoria);
  }

  onCategoriaToggle(c: Categoria, checked: boolean) {
    const arr = this.categoriasArray;
    if (checked) {
      arr.push(new UntypedFormControl(c));
    } else {
      const idx = arr.value.findIndex((x: Categoria) => x?.idCategoria === c?.idCategoria);
      if (idx >= 0) arr.removeAt(idx);
    }
  }

  toggleFullWidth() {
    this.stateService.toggleFullWidth();
    this.setupEditorScrollListener();
  }

  toggleFullScreen() {
    this.stateService.toggleFullScreen();
    this.setupEditorScrollListener();
  }

  estanTodasCategoriasSeleccionadas(): boolean {
    if (this.categorias.length === 0) return false;
    return this.categorias.every((c) => this.hasCategoria(c));
  }

  estanAlgunasCategoriasSeleccionadas(): boolean {
    if (this.categorias.length === 0) return false;
    const selectedCount = this.categorias.filter((c) => this.hasCategoria(c)).length;
    return selectedCount > 0 && selectedCount < this.categorias.length;
  }

  toggleTodasCategorias(event: any): void {
    const checked = event.target.checked;
    const arr = this.categoriasArray;

    // Limpiar selección actual
    arr.clear();

    if (checked) {
      // Agregar todas
      this.categorias.forEach((c) => {
        arr.push(new UntypedFormControl(c));
      });
    }
  }

  abrirSelectorImagen() {
    if (this.form.disabled) {
      return;
    }
    this.modalSeleccionVisible = true;
  }

  cerrarSelectorImagen() {
    this.modalSeleccionVisible = false;
  }

  onMediaSelected(item: MediaItem) {
    if (!item || !item.uuid) {
      this.cerrarSelectorImagen();
      return;
    }

    this.fileStorage.obtenerDatosFichero(item.uuid, true).subscribe({
      next: (datos: any) => {
        const b64: string | undefined = datos?.contenido;
        const mime: string = datos?.tipo || item.mime || 'image/*';
        if (!b64) {
          this.cerrarSelectorImagen();
          return;
        }
        const dataUrl = `data:${mime};base64,${b64}`;
        this.form.patchValue({ imagenDestacada: dataUrl });
        this.form.markAsDirty();
        this.cerrarSelectorImagen();
      },
      error: () => {
        this.cerrarSelectorImagen();
      },
    });
  }

  onQuitarImagen() {
    this.form.patchValue({ imagenDestacada: null });
    this.form.markAsDirty();
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private setupEditorScrollListener(): void {
    setTimeout(() => {
      const editorMain = document.querySelector('.ck-editor__main');
      if (!editorMain) {
        return;
      }

      editorMain.removeEventListener('scroll', this.onInternalScroll as any);
      editorMain.addEventListener('scroll', this.onInternalScroll as any);

      if (this.isFullScreen) {
        this.stateService.updateState({
          showBackToTop: (editorMain as any).scrollTop > 300,
        });
      } else {
        const scrollPosition =
          window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.stateService.updateState({
          showBackToTop: scrollPosition > 300,
        });
      }
      this.cdRef.markForCheck();
    }, 200);
  }

  private onInternalScroll = (event: any) => {
    const target = event?.target as HTMLElement | null;
    if (!target) {
      return;
    }
    this.stateService.updateState({ showBackToTop: target.scrollTop > 300 });
    this.cdRef.markForCheck();
  };

  scrollToTop() {
    if (this.isFullScreen) {
      const editorMain = document.querySelector('.ck-editor__main');
      if (editorMain && typeof (editorMain as any).scrollTo === 'function') {
        (editorMain as any).scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async loadEditorBuild(): Promise<void> {
    try {
      this.editorLoading = true;
      const mod = await import('@ckeditor/ckeditor5-build-classic');
      this.Editor = (mod as any).default ? (mod as any).default : mod;
    } catch (error) {
      console.error('Error cargando CKEditor build dinámicamente:', error);
    } finally {
      this.editorLoading = false;
    }
  }

  onReady(editor: any): void {
    this.editorInstance = editor;
    this.updateEditorDisabledState();
    this.setupEditorScrollListener();
  }

  private updateEditorDisabledState(): void {
    if (!this.editorInstance || !this.form) {
      return;
    }
    const disabled = this.form.get('contenido')?.disabled;
    const lockId = 'angular-disabled-lock';
    if (disabled) {
      this.editorInstance.enableReadOnlyMode(lockId);
    } else {
      this.editorInstance.disableReadOnlyMode(lockId);
    }
  }

  private checkNavigationState(): void {
    // Usar history.state es más fiable en ngOnInit que router.getCurrentNavigation()
    const state = history.state;

    if (state?.temporaryEntry && state?.recoverData) {
      this.log.info('🔄 Recibiendo entrada temporal desde navegación:', state.temporaryEntry);

      // Usamos setTimeout para asegurar que la directiva appUnsavedWork haya inicializado
      // y capturado el estado "vacío" del formulario antes de parchearlo.
      setTimeout(() => {
        this.stateService.setRecoveringFromNavigation(true);

        this.recoverTemporaryData(state.temporaryEntry.formData);

        // No eliminamos la entrada aquí para permitir que el usuario decida si guardar o no
        // Solo limpiamos el estado de navegación
        this.router.navigate([], {
          replaceUrl: true,
          state: { ...state, temporaryEntry: null, recoverData: null },
        });
      }, 100);
    }
  }

  onRecoverData(): void {
    if (!this.temporaryData) {
      this.stateService.dismissRecoveryNotification();
      return;
    }
    
    // Almacenar referencias antes de ocultar la notificación
    const dataToRecover = this.temporaryData.formData;
    const entryId = this.temporaryData.id;

    // 1. Ocultar notificación primero
    this.stateService.dismissRecoveryNotification();
    
    // 2. Dar tiempo al ciclo de detección de cambios de Angular para eliminar el elemento del DOM
    // Esto evita bloqueos de UI o problemas de renderizado ("pantalla seminegra")
    setTimeout(() => {
      this.recoverTemporaryData(dataToRecover);
      this.temporaryStorage.removeTemporaryEntry(entryId);
      this.cdRef.markForCheck();
    }, 100);
  }

  onIgnoreData(): void {
    this.stateService.dismissRecoveryNotification();
    this.log.info('ℹ️ Usuario ignoró los datos temporales');
  }

  onDiscardData(): void {
    this.stateService.clearTemporaryData();
    this.log.info('🗑️ Usuario descartó los datos temporales');
  }

  private recoverTemporaryData(formData: any): void {
    try {
      this.log.info('🔄 Recuperando datos temporales...', formData);

      if (!formData || !this.form) {
        return;
      }

      this.form.patchValue({
        idEntrada: formData.idEntrada ?? this.form.get('idEntrada')?.value ?? null,
        idUsuario: formData.idUsuario ?? this.form.get('idUsuario')?.value ?? null,
        idUsuarioEditado:
          formData.idUsuarioEditado ?? this.form.get('idUsuarioEditado')?.value ?? null,
        titulo: formData.titulo ?? '',
        subtitulo: formData.subtitulo ?? '',
        slug: formData.slug ?? '',
        resumen: formData.resumen ?? '',
        contenido: formData.contenido ?? '',
        notas: formData.notas ?? '',
        borrador: formData.borrador ?? this.form.get('borrador')?.value ?? true,
        publicada: formData.publicada ?? this.form.get('publicada')?.value ?? false,
        password: formData.password ?? '',
        privado: formData.privado ?? this.form.get('privado')?.value ?? false,
        permitirComentario:
          formData.permitirComentario ?? this.form.get('permitirComentario')?.value ?? true,
        imagenDestacada:
          formData.imagenDestacada ?? this.form.get('imagenDestacada')?.value ?? null,
        fechaPublicacion:
          formData.fechaPublicacion ?? this.form.get('fechaPublicacion')?.value ?? null,
        fechaEdicion: formData.fechaEdicion ?? this.form.get('fechaEdicion')?.value ?? null,
        fechaPublicacionProgramada:
          formData.fechaPublicacionProgramada ??
          this.form.get('fechaPublicacionProgramada')?.value ??
          null,
        estadoEntrada: formData.estadoEntrada ?? null,
        tipoEntrada: formData.tipoEntrada ?? null,
        votos: formData.votos ?? this.form.get('votos')?.value ?? 0,
        cantidadComentarios:
          formData.cantidadComentarios ?? this.form.get('cantidadComentarios')?.value ?? 0,
        categoriasConComas: formData.categoriasConComas ?? '',
        usernameCreador: formData.usernameCreador ?? this.form.get('usernameCreador')?.value ?? '',
      });

      if (formData.categorias && Array.isArray(formData.categorias)) {
        const categoriasArray = this.categoriasArray;
        categoriasArray.clear();

        formData.categorias.forEach((categoria: Categoria) => {
          categoriasArray.push(new UntypedFormControl(categoria));
        });
      }

      if (formData.etiquetas && Array.isArray(formData.etiquetas)) {
        const etiquetasArray = this.vf.getEtiquetasArray(this.form);
        etiquetasArray.clear();

        formData.etiquetas.forEach((etiqueta: any) => {
          etiquetasArray.push(new UntypedFormControl(etiqueta));
        });
      }

      this.log.info('✅ Datos temporales recuperados correctamente');

      this.stateService.removeCurrentTemporaryEntry();
      this.cdRef.markForCheck();
    } catch (error) {
      this.log.error('❌ Error al recuperar datos temporales:', error);
    }
  }

  private saveBeforeLogout(): void {
    this.log.info('💾 Guardando entrada antes del logout...');

    if (this.form.valid) {
      this.onSubmit();
    }
  }

  private saveToTemporaryStorage(): void {
    const formData = this.form.value;
    this.stateService.saveTemporaryEntry({
      formData,
      title: formData.titulo || this.translate.instant('ADMIN.ENTRIES.UNTITLED_ENTRY'),
      description: `${this.translate.instant('COMMON.CREATED')}: ${new Date().toLocaleString()}`,
    });
  }

  onSubmit() {
    if (!this.form) return;

    if (this.form.valid) {
      this.log.info('💾 Intentando guardar entrada...');
      const clean = this.sanitizeHtmlFields(this.form.getRawValue());
      this.submitForm.emit(clean as Entrada);

      this.stateService.removeCurrentTemporaryEntry();
    } else {
      this.form.markAllAsTouched();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.isFullScreen) {
      return;
    }
    const scrollPosition =
      window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.stateService.updateState({ showBackToTop: scrollPosition > 300 });
  }

  control(path: string) {
    return this.form ? this.form.get(path) : null;
  }

  private sanitizeHtmlFields(val: any): any {
    const sanitize = (html: string | null | undefined) => {
      if (!html || typeof html !== 'string') return html;
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_ELEMENT, null);
      const toRemove: Element[] = [];
      while (walker.nextNode()) {
        const el = walker.currentNode as Element;
        if (el.tagName.toLowerCase() === 'script' || el.tagName.toLowerCase() === 'iframe') {
          toRemove.push(el);
          continue;
        }
        for (const attr of Array.from(el.attributes)) {
          const n = attr.name.toLowerCase();
          const v = attr.value;
          if (n.startsWith('on')) el.removeAttribute(attr.name);
          if (n === 'src' || n === 'href') {
            const lower = (v || '').toLowerCase().trim();
            if (lower.startsWith('javascript:') || lower.startsWith('data:text/html')) {
              el.removeAttribute(attr.name);
            }
          }
        }
      }
      toRemove.forEach((e) => e.remove());
      return tpl.innerHTML;
    };
    return {
      ...val,
      contenido: sanitize(val?.contenido),
      resumen: sanitize(val?.resumen),
    };
  }
}
