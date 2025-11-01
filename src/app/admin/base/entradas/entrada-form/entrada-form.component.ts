import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { UntypedFormGroup, FormArray, FormControl } from '@angular/forms';
import { Categoria } from '../../../../core/models/categoria.model';
import { TipoEntrada } from '../../../../core/models/tipo-entrada.model';
import { Entrada } from '../../../../core/models/entrada.model';

@Component({
  selector: 'app-entrada-form',
  templateUrl: './entrada-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntradaFormComponent {
  public Editor = ClassicEditor;

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
  @Input() estadosEntr: any[] = [];
  @Input() categorias: Categoria[] = []; // lista maestra de categorías para mostrar
  @Input() modoLectura = false; // si true, el componente mostrará el botón "Editar"
  @Input() entrada?: Entrada; // opcional: datos actuales de la entrada (para checked inicial)
  @Input() submitted = false; // el contenedor puede pasar el estado "submitted"

  @Output() submitForm = new EventEmitter<Entrada>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<void>();
  @Output() preview = new EventEmitter<Entrada>();

  constructor() {
  }

  onSubmit() {
    if (!this.form) return;
    if (this.form.valid) {
      this.submitForm.emit(this.form.value as Entrada);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onReset() {
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
