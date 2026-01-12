import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnChanges,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormGroup, FormArray, FormControl } from '@angular/forms';
import { Categoria } from '../../../../core/models/categoria.model';
import { TipoEntrada } from '../../../../core/models/tipo-entrada.model';
import { Entrada } from '../../../../core/models/entrada.model';
import { EstadoEntrada } from '../../../../core/models/estado-entrada.model';
import { TemporaryStorageService } from '../../../../core/services/ui/temporary-storage.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { OPConstants } from '../../../../shared/constants/op-global.constants';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { SafeUrl } from '@angular/platform-browser';
import { ViewChild } from '@angular/core';
import { ImagenesComponent } from '../../contenido/imagenes/imagenes.component';
import { TranslationService } from '../../../../core/services/translation.service';
import { EntradaImageService } from '../services/entrada-image.service';
import { EntradaFormStateService } from '../services/entrada-form-state.service';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-entrada-form',
  templateUrl: './entrada-form.component.html',
  styleUrls: ['./entrada-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EntradaFormStateService],
  standalone: false,
})
export class EntradaFormComponent implements OnInit, OnChanges {
  @Input() editorConfig: any = {
    licenseKey: 'GPL',
    toolbar: {
      items: [
        'heading',
        'bold',
        'italic',
        'link',
        'bulletedList',
        'numberedList',
        'blockQuote',
        'imageUpload',
        'insertTable',
        'mediaEmbed',
        'undo',
        'redo',
      ],
      shouldNotGroupWhenFull: true,
    },
    image: {
      toolbar: ['imageStyle:full', 'imageStyle:side', 'imageTextAlternative'],
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
    },
  };
  @Input() form!: UntypedFormGroup; // el FormGroup lo crea el contenedor (buildForm)
  @Input() tiposEntr: TipoEntrada[] = [];
  @Input() estadosEntr: EstadoEntrada[] = [];
  @Input() categorias: Categoria[] = []; // lista maestra de categorías para mostrar
  @Input() modoLectura = false; // si true, el componente mostrará el botón "Editar"
  @Input() entrada?: Entrada; // opcional: datos actuales de la entrada (para checked inicial)
  @Input() submitted = false; // el contenedor puede pasar el estado "submitted"

  @Output() submitForm = new EventEmitter<Entrada>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<void>();
  @Output() preview = new EventEmitter<Entrada>();

  @ViewChild(ImagenesComponent) imagenesComponent?: ImagenesComponent;

  public Editor: any = null;
  public editorLoading = false;
  public estaEditando = false;

  // State delegation getters
  get isFullWidth() { return this.stateService.currentState.isFullWidth; }
  get isFullScreen() { return this.stateService.currentState.isFullScreen; }
  get showBackToTop() { return this.stateService.currentState.showBackToTop; }
  get showRecoveryNotification() { return this.stateService.currentState.showRecoveryNotification; }
  get temporaryData() { return this.stateService.currentState.temporaryData; }
  get imagenPreviewUrl() { return this.stateService.currentState.imagenPreviewUrl; }
  set imagenPreviewUrl(val: SafeUrl | string | null) { this.stateService.setImagenPreviewUrl(val); }

  private destroy$ = new Subject<void>();

  constructor(
    private temporaryStorage: TemporaryStorageService,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private log: LoggerService,
    private imageService: EntradaImageService,
    private toastService: ToastService,
    private translate: TranslationService,
    public stateService: EntradaFormStateService
  ) { }

  ngOnInit(): void {
    // Sync state changes with view
    this.stateService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdRef.markForCheck();
      });

    window.addEventListener(OPConstants.Events.SAVE_UNSAVED_WORK, this.saveBeforeLogout.bind(this));

    // Verificar navegación con recuperación
    this.checkNavigationState();

    // Verificar datos temporales solo si no venimos de recuperación
    this.stateService.checkForTemporaryData(this.estaEditando);

    // Cargar CKEditor dinámicamente
    this.loadEditorBuild();

    // Cargar preview segura si ya existe imagen destacada
    const currentImg = this.imagenDestacadaUrl;
    if (currentImg) {
      this.checkAndLoadSecureImage(currentImg);
    }
  }

  // Helper para cargar imagen segura si es un endpoint protegido
  private checkAndLoadSecureImage(url: string): void {
    const uuid = this.imageService.extractUuidFromUrl(url);
    if (uuid) {
      this.cargarPreviewSegura(uuid);
    }
  }

  private cargarPreviewSegura(uuid: string): void {
    this.imageService.loadSecureImage(uuid).subscribe({
      next: (safeUrl) => {
        // Revocar anterior si era blob
        this.imageService.revokeUrl(this.imagenPreviewUrl);

        this.imagenPreviewUrl = safeUrl;
        this.cdRef.markForCheck();
      },
      error: (err) => console.error('Error cargando preview segura', err),
    });
  }

  // ✅ NUEVO: Subida de imagen
  onImagenSeleccionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      // 1. Procesar imagen para preview y base64
      this.imageService.processSelectedImage(file).subscribe({
        next: (result) => {
          // Revocar URL anterior si es necesario
          this.imageService.revokeUrl(this.imagenPreviewUrl);

          // Asignar preview
          this.imagenPreviewUrl = result.previewUrl;

          // Asignar Base64 al formulario
          this.form.patchValue({ imagenDestacada: result.base64 });
          this.form.markAsDirty();
          this.cdRef.markForCheck();
        },
        error: (err) => this.log.error('Error procesando imagen', err)
      });

      // 2. Subir a librería (efecto secundario, no bloqueante)
      this.imageService.uploadToLibrary(file).subscribe({
        next: (response) => {
          // Refrescar librería si está cargada
          if (this.imagenesComponent) {
            this.imagenesComponent.load();
          }
          this.toastService.showSuccess(
            this.translate.instant('ADMIN.ENTRIES.IMAGE_UPLOADED_SUCCESS'), 
            this.translate.instant('COMMON.SUCCESS')
          );
        },
        error: (err) => {
          // No mostramos error bloqueante porque ya tenemos la imagen en local para enviar
          this.log.error('Error subiendo imagen a librería', err);
        }
      });
    }
  }

  private handleUploadSuccess(url: string) {
    // Deprecado para el valor del formulario, pero útil si quisiéramos usar URL
    // this.form.patchValue({ imagenDestacada: url });
  }

  onQuitarImagen() {
    this.form.patchValue({ imagenDestacada: null });
    this.imagenPreviewUrl = null;
    this.form.markAsDirty();
    // Limpiar el input file si es necesario
    const fileInput = document.getElementById('selImagenDestacada') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    this.cdRef.markForCheck();
  }

  get imagenDestacadaUrl(): string | null {
    return this.form.get('imagenDestacada')?.value;
  }

  // Carga dinámica del build pesado de CKEditor para reducir tamaño del chunk inicial
  private async loadEditorBuild(): Promise<void> {
    try {
      this.editorLoading = true;
      const mod = await import('@ckeditor/ckeditor5-build-classic');
      // Algunos empaquetados exportan por defecto en default
      this.Editor = mod && (mod as any).default ? (mod as any).default : mod;
    } catch (error) {
      this.log.error('❌ Error cargando CKEditor build dinámicamente:', error);
    } finally {
      this.editorLoading = false;
      this.cdRef.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    window.removeEventListener(
      OPConstants.Events.SAVE_UNSAVED_WORK,
      this.saveBeforeLogout.bind(this)
    );

    // Limpiar listener interno si existe
    const editorMain = document.querySelector('.ck-editor__main');
    if (editorMain) {
      editorMain.removeEventListener('scroll', this.onInternalScroll);
    }
  }

  private checkNavigationState(): void {
    const navigation = this.router.currentNavigation();
    const state = navigation?.extras?.state as any;

    if (state?.temporaryEntry && state?.recoverData) {
      this.log.info('🔄 Recibiendo entrada temporal desde navegación:', state.temporaryEntry);
      
      this.stateService.setRecoveringFromNavigation(true);

      // Recuperar los datos en el formulario
      this.recoverTemporaryData(state.temporaryEntry.formData);

      // Eliminar la entrada temporal del almacenamiento
      this.temporaryStorage.removeTemporaryEntry(state.temporaryEntry.id);

      // Limpiar el estado de navegación
      this.router.navigate([], {
        replaceUrl: true,
        state: [null],
      });
    }
  }

  // ✅ REVERTIMOS: Métodos para notificación individual
  onRecoverData(): void {
    this.stateService.dismissRecoveryNotification();
    this.recoverTemporaryData(this.temporaryData.formData);
    this.temporaryStorage.removeTemporaryEntry(this.temporaryData.id);
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

      // Actualizar el formulario con los datos temporales
      this.form.patchValue({
        titulo: formData.titulo || '',
        subtitulo: formData.subtitulo || '',
        contenido: formData.contenido || '',
        resumen: formData.resumen || '',
        estadoEntrada: formData.estadoEntrada || null,
        tipoEntrada: formData.tipoEntrada || null,
        publicada: formData.publicada || false,
        privado: formData.privado || false,
        permitirComentario: formData.permitirComentario || false,
        password: formData.password || '',
      });

      // Recuperar categorías si existen
      if (formData.categorias && Array.isArray(formData.categorias)) {
        const categoriasArray = this.categoriasArray();
        categoriasArray.clear();

        formData.categorias.forEach((categoria: Categoria) => {
          categoriasArray.push(new FormControl(categoria));
        });
      }

      this.log.info('✅ Datos temporales recuperados correctamente');

      // Limpiar datos temporales después de recuperarlos
      this.stateService.removeCurrentTemporaryEntry();
    } catch (error) {
      this.log.error('❌ Error al recuperar datos temporales:', error);
    }
  }

  ngOnChanges(): void {
    if (this.entrada && this.entrada.idEntrada) {
      this.estaEditando = true;
    }
  }

  private saveBeforeLogout(): void {
    this.log.info('💾 Guardando entrada antes del logout...');

    if (this.form.valid) {
      this.onSubmit();
    }

    // ✅ MODIFICADO: Siempre guardar temporalmente, incluso si el formulario no es válido
    this.saveToTemporaryStorage();
  }

  private saveToTemporaryStorage(): void {
    const formData = this.form.value;
    this.stateService.saveTemporaryEntry({
      formData,
      title: formData.titulo || this.translate.instant('ADMIN.ENTRIES.UNTITLED_ENTRY'),
      description: `${this.translate.instant('COMMON.CREATED')}: ${new Date().toLocaleString()}`
    });
  }

  onSubmit() {
    if (!this.form) return;

    if (this.form.valid) {
      this.log.info('💾 Intentando guardar entrada...');
      const clean = this.sanitizeHtmlFields(this.form.value);
      this.submitForm.emit(clean as Entrada);

      // ✅ MODIFICADO: Limpiar entrada temporal específica al guardar exitosamente
      this.stateService.removeCurrentTemporaryEntry();
    } else {
      this.form.markAllAsTouched();
    }
  }

  onReset() {
    // ✅ MODIFICADO: Limpiar entrada temporal específica al cancelar
    this.stateService.removeCurrentTemporaryEntry();
    this.cancelar.emit();
  }

  onEditar() {
    this.editar.emit();
  }

  onPreview() {
    this.preview.emit(this.form.value as Entrada);
  }

  toggleFullWidth() {
    this.stateService.toggleFullWidth();
    this.setupEditorScrollListener();
  }

  toggleFullScreen() {
    this.stateService.toggleFullScreen();
    this.setupEditorScrollListener();
  }

  private setupEditorScrollListener() {
    // Pequeño retraso para asegurar que el DOM se ha actualizado
    setTimeout(() => {
      const editorMain = document.querySelector('.ck-editor__main');
      if (!editorMain) return;

      // Limpiar listener anterior
      editorMain.removeEventListener('scroll', this.onInternalScroll);

      // SIEMPRE usar scroll interno (ahora que CSS lo fuerza en todos los modos)
      editorMain.addEventListener('scroll', this.onInternalScroll);
      
      // Verificar estado inicial
      this.stateService.updateState({ showBackToTop: editorMain.scrollTop > 300 });
      
      this.cdRef.detectChanges();
    }, 200);
  }

  // Arrow function para mantener el contexto 'this' automáticamente
  private onInternalScroll = (event: any) => {
    // El scroll siempre es interno ahora
    this.stateService.updateState({ showBackToTop: event.target.scrollTop > 300 });
    this.cdRef.detectChanges();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Método vacío o para otra lógica global, pero el editor ya no depende de esto
  }

  scrollToTop() {
    // Siempre usar scroll interno del editor
    const editorMain = document.querySelector('.ck-editor__main');
    if (editorMain) {
      editorMain.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
            if (lower.startsWith('javascript:') || lower.startsWith('data:text/html'))
              el.removeAttribute(attr.name);
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

  // ===== SISTEMA DE CATEGORÍAS UNIFICADO =====

  // Helpers para FormArray de categorías (OBJETOS COMPLETOS)
  categoriasArray(): FormArray {
    const ctrl = this.form?.get('categorias');

    if (!ctrl) {
      // Si no existe, crea un FormArray vacío en el form
      this.form?.addControl('categorias', new FormArray([]));
      return this.form.get('categorias') as FormArray;
    }
    return ctrl as FormArray;
  }

  // Verificar si una categoría está seleccionada (por ID)
  isCategoriaSelected(categoria: Categoria): boolean {
    const arr = this.categoriasArray();
    return arr.controls.some(
      (control) => control.value && control.value.nombre === categoria.nombre
    );
  }

  // Cambiar el estado de una categoría (versión unificada)
  onCategoriaChange(categoria: Categoria, event: any): void {
    if (!this.form.enabled) {
      event.preventDefault();
      return;
    }

    const arr = this.categoriasArray();

    if (event.target.checked) {
      // Agregar la categoría al FormArray si no existe
      if (!this.isCategoriaSelected(categoria)) {
        arr.push(new FormControl(categoria));
      }
    } else {
      // Buscar y remover la categoría por nombre
      const index = arr.controls.findIndex(
        (control) => control.value && control.value.nombre === categoria.nombre
      );

      if (index > -1) {
        arr.removeAt(index);
      }
    }

    // Forzar actualización de la vista
    setTimeout(() => {
      this.cdRef.detectChanges();
    });
  }

  // Método para seleccionar/deseleccionar todas las categorías (usando FormArray)
  toggleTodasCategorias(event: any): void {
    const arr = this.categoriasArray();

    if (event.target.checked) {
      // Limpiar el array primero
      while (arr.length !== 0) {
        arr.removeAt(0);
      }
      // Agregar todas las categorías como objetos completos
      this.categorias.forEach((categoria) => {
        arr.push(new FormControl(categoria));
      });
    } else {
      // Limpiar todas las categorías
      while (arr.length !== 0) {
        arr.removeAt(0);
      }
    }
    arr.markAsDirty();
    this.form.markAsDirty();
  }

  // Verificar si todas las categorías están seleccionadas
  estanTodasCategoriasSeleccionadas(): boolean {
    const arr = this.categoriasArray();
    return arr.length === this.categorias.length && this.categorias.length > 0;
  }

  // Verificar si alguna categoría está seleccionada (para estado indeterminado)
  estanAlgunasCategoriasSeleccionadas(): boolean {
    const arr = this.categoriasArray();
    return arr.length > 0 && arr.length < this.categorias.length;
  }

  // Obtener solo los IDs de las categorías seleccionadas (para enviar al API)
  getCategoriasIds(): number[] {
    const arr = this.categoriasArray();
    return arr.controls
      .filter((control) => control.value)
      .map((control) => control.value.idCategoria);
  }

  // Selector de imagen de librería
  modalSeleccionVisible = false;

  abrirSelectorImagen(): void {
    this.modalSeleccionVisible = true;
  }

  cerrarSelectorImagen(): void {
    this.modalSeleccionVisible = false;
  }

  onMediaSelected(item: any): void {
    if (item) {
      this.log.info('Media seleccionado de galería:', item);

      // Si tiene UUID, descargamos el blob
      if (item.uuid) {
        this.imageService.downloadImageAsBase64(item.uuid).subscribe({
          next: (base64: string) => {
            // Limpieza de URL anterior si era blob
            this.imageService.revokeUrl(this.imagenPreviewUrl);

            // Usamos Base64 para la preview (igual que en onImagenSeleccionada)
            this.imagenPreviewUrl = base64;

            // Y para el formulario
            this.form.patchValue({ imagenDestacada: base64 });
            this.form.markAsDirty();
            this.cdRef.markForCheck();
          },
          error: (err: any) => {
            this.log.error('Error descargando fichero de galería', err);
            this.toastService.showError(this.translate.instant('ADMIN.ENTRIES.IMAGE_LOAD_ERROR'), this.translate.instant('COMMON.ERROR'));
          }
        });
      }
      // Si solo tiene URL (caso raro o legacy), intentamos usarla pero probablemente falle en backend si espera byte[]
      else if (item.url) {
        this.log.warn('Item de galería sin UUID, usando URL (puede fallar en backend)', item.url);
        this.form.patchValue({ imagenDestacada: item.url });
        this.imagenPreviewUrl = item.url;
      }
    }
    this.cerrarSelectorImagen();
  }
}
