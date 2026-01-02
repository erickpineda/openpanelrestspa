import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnChanges,
  ChangeDetectorRef,
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
import { FileStorageService } from '../../../../core/services/file-storage.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ViewChild } from '@angular/core';
import { ImagenesComponent } from '../../contenido/imagenes/imagenes.component';

@Component({
  selector: 'app-entrada-form',
  templateUrl: './entrada-form.component.html',
  styleUrls: ['./entrada-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  // ✅ REVERTIMOS: Volvemos a notificación individual
  showRecoveryNotification = false;
  showMultipleRecoveryNotification = false; // Mantenemos por si acaso, pero no la usaremos
  temporaryData: any = null;
  multipleTemporaryEntries: any[] = [];

  // ✅ NUEVO: Bandera para controlar si estamos recuperando desde navegación
  private isRecoveringFromNavigation = false;

  // ✅ NUEVO: ID único para esta instancia de formulario
  private currentTemporaryEntryId: string | null = null;

  public imagenPreviewUrl: SafeUrl | string | null = null;

  constructor(
    private temporaryStorage: TemporaryStorageService,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private log: LoggerService,
    private fileStorage: FileStorageService,
    private toastService: ToastService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    window.addEventListener(OPConstants.Events.SAVE_UNSAVED_WORK, this.saveBeforeLogout.bind(this));

    // Verificar navegación con recuperación
    this.checkNavigationState();

    // Verificar datos temporales solo si no venimos de recuperación
    if (!this.estaEditando && !this.isRecoveringFromNavigation) {
      this.checkForTemporaryData();
    }

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
    // Regex simple para detectar UUID en la URL de descarga
    const match = url.match(/\/descargar\/([0-9a-fA-F-]{36})/);
    if (match && match[1]) {
      this.cargarPreviewSegura(match[1]);
    }
  }

  private cargarPreviewSegura(uuid: string): void {
    this.fileStorage.descargarFichero(uuid).subscribe({
      next: (blob) => {
        // Solo revocamos si es string, SafeUrl no se puede revocar así
        if (typeof this.imagenPreviewUrl === 'string') {
          URL.revokeObjectURL(this.imagenPreviewUrl);
        }
        
        const objectUrl = URL.createObjectURL(blob);
        this.imagenPreviewUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.cdRef.markForCheck();
      },
      error: (err) => console.error('Error cargando preview segura', err),
    });
  }

  // ✅ NUEVO: Subida de imagen
  onImagenSeleccionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Preview inmediata local y conversión a Base64 para el backend
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result;
        
        // Revocar URL anterior si era un string (blob url)
        if (typeof this.imagenPreviewUrl === 'string') {
           URL.revokeObjectURL(this.imagenPreviewUrl);
        }
        
        // Base64 es seguro para mostrar directamente (data:image/...)
        // Opcionalmente podríamos sanitizarlo también, pero suele funcionar directo en src
        this.imagenPreviewUrl = base64;
        
        // IMPORTANTE: El backend espera byte[] (Base64), no una URL.
        // Asignamos el Base64 directamente al formulario.
        this.form.patchValue({ imagenDestacada: base64 });
        this.form.markAsDirty();
        this.cdRef.markForCheck();
      };
      reader.readAsDataURL(file);

      this.log.info('Subiendo imagen destacada a librería...', file.name);

      // Subimos a FileStorage solo para tenerla en la librería, pero no usamos la URL retornada para el form
      this.fileStorage.uploadFile(file).subscribe({
        next: (response: any) => {
           this.log.info('Imagen subida a librería correctamente', response);
           // Refrescar librería si está cargada
           if (this.imagenesComponent) {
             this.imagenesComponent.load();
           }
           this.toastService.showSuccess('Imagen disponible en librería', 'Éxito');
        },
        error: (err) => {
          this.log.error('Error subiendo imagen a librería', err);
          // No mostramos error bloqueante porque ya tenemos la imagen en local para enviar
        },
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
    window.removeEventListener(
      OPConstants.Events.SAVE_UNSAVED_WORK,
      this.saveBeforeLogout.bind(this)
    );
  }

  private checkNavigationState(): void {
    const navigation = this.router.currentNavigation();
    const state = navigation?.extras?.state as any;

    if (state?.temporaryEntry && state?.recoverData) {
      this.log.info('🔄 Recibiendo entrada temporal desde navegación:', state.temporaryEntry);
      this.isRecoveringFromNavigation = true;

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

  private checkForTemporaryData(): void {
    const temporaryEntries = this.temporaryStorage.getTemporaryEntriesByType('entrada');

    if (temporaryEntries.length > 0 && !this.isRecoveringFromNavigation) {
      this.log.info('📥 Entradas temporales encontradas en formulario:', temporaryEntries);

      // ✅ REVERTIMOS: Volvemos al comportamiento original - mostrar individual
      if (temporaryEntries.length === 1) {
        // Una sola entrada - mostrar notificación individual
        this.temporaryData = temporaryEntries[0];
        this.showRecoveryNotification = true;
      } else {
        // Múltiples entradas - mostrar notificación individual de la más reciente
        const mostRecent = temporaryEntries.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        this.temporaryData = mostRecent;
        this.showRecoveryNotification = true;
      }
    }
  }

  // ✅ REVERTIMOS: Métodos para notificación individual
  onRecoverData(): void {
    this.showRecoveryNotification = false;
    this.recoverTemporaryData(this.temporaryData.formData);
    this.temporaryStorage.removeTemporaryEntry(this.temporaryData.id);
  }

  onIgnoreData(): void {
    this.showRecoveryNotification = false;
    this.log.info('ℹ️ Usuario ignoró los datos temporales');
  }

  onDiscardData(): void {
    this.showRecoveryNotification = false;
    this.temporaryStorage.removeTemporaryEntry(this.temporaryData.id);
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
      if (this.currentTemporaryEntryId) {
        this.temporaryStorage.removeTemporaryEntry(this.currentTemporaryEntryId);
        this.currentTemporaryEntryId = null;
      }
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
    try {
      const formData = this.form.value;

      // ✅ NUEVO: Crear entrada temporal con metadatos
      const temporaryEntry = {
        formData: formData,
        timestamp: new Date().toISOString(),
        formType: 'entrada', // Tipo de formulario
        title: formData.titulo || 'Entrada sin título', // Título para mostrar
        description: `Creada: ${new Date().toLocaleString()}`, // Descripción
      };

      // Si ya existe una entrada temporal para este formulario, actualizarla
      if (this.currentTemporaryEntryId) {
        this.temporaryStorage.removeTemporaryEntry(this.currentTemporaryEntryId);
      }

      // Guardar nueva entrada temporal
      this.currentTemporaryEntryId = this.temporaryStorage.saveTemporaryEntry(temporaryEntry);

      this.log.info(
        '✅ Datos guardados en almacenamiento temporal con ID:',
        this.currentTemporaryEntryId
      );
    } catch (error) {
      this.log.error('❌ Error al guardar temporalmente:', error);
    }
  }

  onSubmit() {
    if (!this.form) return;

    if (this.form.valid) {
      this.log.info('💾 Intentando guardar entrada...');
      const clean = this.sanitizeHtmlFields(this.form.value);
      this.submitForm.emit(clean as Entrada);

      // ✅ MODIFICADO: Limpiar entrada temporal específica al guardar exitosamente
      if (this.currentTemporaryEntryId) {
        this.temporaryStorage.removeTemporaryEntry(this.currentTemporaryEntryId);
        this.currentTemporaryEntryId = null;
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  onReset() {
    // ✅ MODIFICADO: Limpiar entrada temporal específica al cancelar
    if (this.currentTemporaryEntryId) {
      this.temporaryStorage.removeTemporaryEntry(this.currentTemporaryEntryId);
      this.currentTemporaryEntryId = null;
    }
    this.cancelar.emit();
  }

  onEditar() {
    this.editar.emit();
  }

  onPreview() {
    this.preview.emit(this.form.value as Entrada);
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
        this.fileStorage.descargarFichero(item.uuid).subscribe({
          next: (blob: Blob) => {
            // Convertir a Base64 tanto para preview como para el formulario
            // Esto asegura consistencia con la subida local que sí funciona
            const reader = new FileReader();
            reader.onload = (e: any) => {
               const base64 = e.target.result;
               
               // Limpieza de URL anterior si era blob
               if (typeof this.imagenPreviewUrl === 'string' && this.imagenPreviewUrl.startsWith('blob:')) {
                 URL.revokeObjectURL(this.imagenPreviewUrl);
               }

               // Usamos Base64 para la preview (igual que en onImagenSeleccionada)
               this.imagenPreviewUrl = base64;
               
               // Y para el formulario
               this.form.patchValue({ imagenDestacada: base64 });
               this.form.markAsDirty();
               this.cdRef.markForCheck();
            };
            reader.readAsDataURL(blob);
          },
          error: (err) => {
            this.log.error('Error descargando fichero de galería', err);
            this.toastService.showError('No se pudo cargar la imagen seleccionada', 'Error');
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
