import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnChanges,
} from '@angular/core';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Router } from '@angular/router';
import { UntypedFormGroup, FormArray, FormControl } from '@angular/forms';
import { Categoria } from '../../../../core/models/categoria.model';
import { TipoEntrada } from '../../../../core/models/tipo-entrada.model';
import { Entrada } from '../../../../core/models/entrada.model';
import { EstadoEntrada } from '../../../../core/models/estado-entrada.model';
import { TemporaryStorageService } from '../../../../core/services/temporary-storage.service';

@Component({
  selector: 'app-entrada-form',
  templateUrl: './entrada-form.component.html',
  styleUrls: ['./entrada-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  public Editor = ClassicEditor;
  public estaEditando = false;

  // ✅ NUEVO: Propiedades para controlar diferentes tipos de notificaciones
  showRecoveryNotification = false;
  showMultipleRecoveryNotification = false;
  temporaryData: any = null;
  multipleTemporaryEntries: any[] = [];

  // ✅ NUEVO: ID único para esta instancia de formulario
  private currentTemporaryEntryId: string | null = null;

  constructor(
    private temporaryStorage: TemporaryStorageService,
    private router: Router) {

    }

  ngOnInit(): void {
    window.addEventListener('saveUnsavedWork', this.saveBeforeLogout.bind(this));
    
    // ✅ NUEVO: Verificar si venimos de recuperar una entrada temporal
    this.checkNavigationState();

    if (!this.estaEditando) {
      this.checkForTemporaryData();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener(
      'saveUnsavedWork',
      this.saveBeforeLogout.bind(this)
    );
  }

  private checkNavigationState(): void {
    // Obtener el estado de la navegación actual
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as any;
    
    if (state?.temporaryEntry && state?.recoverData) {
      console.log('🔄 Recibiendo entrada temporal desde navegación:', state.temporaryEntry);
      
      // Recuperar los datos en el formulario
      this.recoverTemporaryData(state.temporaryEntry.formData);
      
      // Eliminar la entrada temporal del almacenamiento
      this.temporaryStorage.removeTemporaryEntry(state.temporaryEntry.id);
      
      // Limpiar el estado de navegación para evitar recuperación múltiple
      this.router.navigate([], {
        replaceUrl: true,
        state: [null]
      });
    }
  }

  private checkForTemporaryData(): void {
    const temporaryEntries = this.temporaryStorage.getTemporaryEntriesByType('entrada');
    
    if (temporaryEntries.length > 0) {
      console.log('📥 Entradas temporales encontradas:', temporaryEntries);
      
      if (temporaryEntries.length > 1) {
        // ✅ CAMBIADO: Usar notificación elegante en lugar de confirm
        this.multipleTemporaryEntries = temporaryEntries;
        this.showMultipleRecoveryNotification = true;
      } else {
        // Una sola entrada
        this.temporaryData = temporaryEntries[0];
        this.showRecoveryNotification = true;
      }
    }
  }

  // ✅ NUEVO: Métodos para manejar múltiples entradas con notificación elegante
  onRecoverMostRecent(): void {
    this.showMultipleRecoveryNotification = false;
    const mostRecent = this.multipleTemporaryEntries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    
    this.recoverTemporaryData(mostRecent.formData);
    this.temporaryStorage.removeTemporaryEntry(mostRecent.id);
  }

  onGoToManager(): void {
    this.showMultipleRecoveryNotification = false;
    this.router.navigate(['/admin/control/entradas/entradas-temporales']);
  }

  onIgnoreMultiple(): void {
    this.showMultipleRecoveryNotification = false;
    console.log('ℹ️ Usuario ignoró las múltiples entradas temporales');
  }

  onDiscardMultiple(): void {
    this.showMultipleRecoveryNotification = false;
    this.multipleTemporaryEntries.forEach(entry => {
      this.temporaryStorage.removeTemporaryEntry(entry.id);
    });
    console.log('🗑️ Usuario descartó todas las entradas temporales múltiples');
  }

  // ✅ NUEVO: Métodos para manejar las acciones de la notificación
  onRecoverData(): void {
    this.showRecoveryNotification = false;
    this.recoverTemporaryData(this.temporaryData.formData);
  }

  onIgnoreData(): void {
    this.showRecoveryNotification = false;
    console.log('ℹ️ Usuario eligió ignorar los datos temporales por ahora');
    // Los datos permanecen en almacenamiento temporal para recuperar después
  }

  onDiscardData(): void {
    this.showRecoveryNotification = false;
    this.temporaryStorage.removeTemporaryEntry('unsaved-entrada-form');
    console.log('🗑️ Usuario descartó los datos temporales permanentemente');
  }

  private recoverTemporaryData(formData: any): void {
    try {
      console.log('🔄 Recuperando datos temporales...', formData);
      
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
        password: formData.password || ''
      });

      // Recuperar categorías si existen
      if (formData.categorias && Array.isArray(formData.categorias)) {
        const categoriasArray = this.categoriasArray();
        categoriasArray.clear();
        
        formData.categorias.forEach((categoria: Categoria) => {
          categoriasArray.push(new FormControl(categoria));
        });
      }
      
      console.log('✅ Datos temporales recuperados correctamente');
      
      // Limpiar datos temporales después de recuperarlos
      if (this.currentTemporaryEntryId) {
        this.temporaryStorage.removeTemporaryEntry(this.currentTemporaryEntryId);
        this.currentTemporaryEntryId = null;
      }
      
    } catch (error) {
      console.error('❌ Error al recuperar datos temporales:', error);
    }
  }

  ngOnChanges(): void {
    if (this.entrada && this.entrada.idEntrada) {
      this.estaEditando = true;
    }
  }

  private saveBeforeLogout(): void {
    console.log('💾 Guardando entrada antes del logout...');
    
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
        description: `Creada: ${new Date().toLocaleString()}` // Descripción
      };

      // Si ya existe una entrada temporal para este formulario, actualizarla
      if (this.currentTemporaryEntryId) {
        this.temporaryStorage.removeTemporaryEntry(this.currentTemporaryEntryId);
      }

      // Guardar nueva entrada temporal
      this.currentTemporaryEntryId = this.temporaryStorage.saveTemporaryEntry(temporaryEntry);
      
      console.log('✅ Datos guardados en almacenamiento temporal con ID:', this.currentTemporaryEntryId);
    } catch (error) {
      console.error('❌ Error al guardar temporalmente:', error);
    }
  }

  onSubmit() {
    if (!this.form) return;
    
    if (this.form.valid) {
      console.log('💾 Intentando guardar entrada...');
      this.submitForm.emit(this.form.value as Entrada);
      
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

  // Helpers para FormArray de categorías
  categoriasArray(): FormArray {
    const ctrl = this.form?.get('categorias');
    if (!ctrl) {
      // si no existe, crea un FormArray vacío en el form (protección)
      this.form?.addControl('categorias', new FormArray([]));
      return this.form.get('categorias') as FormArray;
    }
    return ctrl as FormArray;
  }

  isCategoriaChecked(categ: Categoria): boolean {
    const arr = this.categoriasArray();
    return arr.controls.some(
      (c) =>
        c.value &&
        (c.value.idCategoria === categ.idCategoria ||
          c.value.nombre === categ.nombre)
    );
  }

  onToggleCategoria(categ: Categoria, checked: boolean) {
    const arr = this.categoriasArray();
    const existsIndex = arr.controls.findIndex(
      (c) =>
        c.value &&
        (c.value.idCategoria === categ.idCategoria ||
          c.value.nombre === categ.nombre)
    );

    if (checked && existsIndex === -1) {
      arr.push(new FormControl(categ));
    } else if (!checked && existsIndex > -1) {
      arr.removeAt(existsIndex);
    }

    arr.markAsDirty();
  }
}
