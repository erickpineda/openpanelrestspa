import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnChanges } from '@angular/core';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntradaFormComponent implements OnInit, OnChanges {
  public Editor = ClassicEditor;
  public estaEditando = false;

  @Input() editorConfig: any = {
    licenseKey: 'GPL',
    toolbar: {
      items: [
        'heading', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote',
        'imageUpload', 'insertTable', 'mediaEmbed', 'undo', 'redo'
      ],
      shouldNotGroupWhenFull: true
    },
    image: {
      toolbar: [
        'imageStyle:full', 'imageStyle:side', 'imageTextAlternative'
      ]
    },
    table: {
      contentToolbar: [
        'tableColumn', 'tableRow', 'mergeTableCells'
      ]
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

    constructor(
    private temporaryStorage: TemporaryStorageService
  ) {}

  ngOnInit(): void {
    // Escuchar evento de guardado antes del logout
    window.addEventListener('saveUnsavedWork', this.saveBeforeLogout.bind(this));
    
    // Verificar datos temporales solo si estamos creando una nueva entrada
    if (!this.estaEditando) {
      this.checkForTemporaryData();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('saveUnsavedWork', this.saveBeforeLogout.bind(this));
  }

  private checkForTemporaryData(): void {
    const formId = 'unsaved-entrada-form';
    const temporaryData = this.temporaryStorage.getTemporaryEntry(formId);
    
    if (temporaryData && !this.estaEditando) {
      console.log('📥 Datos temporales encontrados en formulario:', temporaryData);
      
      // Usar un setTimeout para asegurar que el formulario esté completamente renderizado
      setTimeout(() => {
        const shouldRecover = confirm(
          'Se encontraron datos no guardados de una sesión anterior. ¿Desea recuperarlos en este formulario?'
        );
        
        if (shouldRecover) {
          this.recoverTemporaryData(temporaryData.formData);
        } else {
          // Preguntar si quiere descartar
          const shouldDiscard = confirm('¿Deseas descartar estos datos permanentemente?');
          if (shouldDiscard) {
            this.temporaryStorage.removeTemporaryEntry(formId);
          }
        }
      }, 500);
    }
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
        // ... otros campos
      });

      // Recuperar categorías si existen
      if (formData.categorias && Array.isArray(formData.categorias)) {
        const categoriasArray = this.categoriasArray();
        categoriasArray.clear();
        
        formData.categorias.forEach((categoria: Categoria) => {
          categoriasArray.push(new FormControl(categoria));
        });
      }
      
      // Recuperar estados booleanos
      if (formData.publicada !== undefined) {
        this.form.patchValue({ publicada: formData.publicada });
      }
      if (formData.privado !== undefined) {
        this.form.patchValue({ privado: formData.privado });
      }
      if (formData.permitirComentario !== undefined) {
        this.form.patchValue({ permitirComentario: formData.permitirComentario });
      }
      
      console.log('✅ Datos temporales recuperados correctamente');
      
      // Limpiar datos temporales después de recuperarlos
      this.temporaryStorage.removeTemporaryEntry('unsaved-entrada-form');
      
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
      // Primero intentar guardar normalmente
      this.onSubmit();
      
      // Como fallback, guardar también temporalmente
      this.saveToTemporaryStorage();
    } else {
      console.warn('⚠️ Formulario inválido, guardando temporalmente...');
      this.saveToTemporaryStorage();
    }
  }

  private saveToTemporaryStorage(): void {
    try {
      const formId = 'unsaved-entrada-form';
      const formData = this.form.value;
      
      this.temporaryStorage.saveTemporaryEntry(formId, formData);
      console.log('✅ Datos guardados en almacenamiento temporal');
    } catch (error) {
      console.error('❌ Error al guardar temporalmente:', error);
    }
  }

  onSubmit() {
    if (!this.form) return;
    
    if (this.form.valid) {
      console.log('💾 Intentando guardar entrada...');
      this.submitForm.emit(this.form.value as Entrada);
      
      // Si se guarda exitosamente, limpiar datos temporales
      this.temporaryStorage.removeTemporaryEntry('unsaved-entrada-form');
    } else {
      this.form.markAllAsTouched();
    }
  }

  onReset() {
    // Limpiar datos temporales al cancelar
    this.temporaryStorage.removeTemporaryEntry('unsaved-entrada-form');
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
    return arr.controls.some(c => c.value && (c.value.idCategoria === categ.idCategoria || c.value.nombre === categ.nombre));
  }

  onToggleCategoria(categ: Categoria, checked: boolean) {
    const arr = this.categoriasArray();
    const existsIndex = arr.controls.findIndex(c => c.value && (c.value.idCategoria === categ.idCategoria || c.value.nombre === categ.nombre));

    if (checked && existsIndex === -1) {
      arr.push(new FormControl(categ));
    } else if (!checked && existsIndex > -1) {
      arr.removeAt(existsIndex);
    }

    arr.markAsDirty();
  }
}
