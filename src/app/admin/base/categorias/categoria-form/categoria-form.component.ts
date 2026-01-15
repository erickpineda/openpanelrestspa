import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Categoria } from '../../../../core/models/categoria.model';

@Component({
  selector: 'app-categoria-form',
  styleUrls: ['./categoria-form.component.scss'],
  templateUrl: './categoria-form.component.html',
  standalone: false,
})
export class CategoriaFormComponent implements OnChanges {
  @Input() categoria?: Categoria;
  @Input() submitted = false;
  @Input() disabled = false;
  @Output() submitCategoria = new EventEmitter<Categoria>();
  @Output() onReset = new EventEmitter<void>();
  @Output() onValidate = new EventEmitter<void>();
  @Output() editarCategoria = new EventEmitter<void>();
  @Output() onError = new EventEmitter<void>();

  form: FormGroup;
  enviando = false;
  mostrarFeedback = false;
  internoSubmitted = false;
  isEditing = false;
  manualCodeEntry = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      idCategoria: [null],
      codigo: [null, [Validators.required, Validators.maxLength(5)]],
      nombre: [null, Validators.required],
      descripcion: [null],
      cantidadEntradas: [0],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoria'] && this.categoria) {
      this.form.patchValue(this.categoria);
      this.isEditing = !!this.categoria.idCategoria;
      
      if (this.isEditing) {
        this.form.get('codigo')?.disable();
      }
      
      if (this.disabled) {
        this.form.disable();
      } else {
        if (!this.isEditing) {
          this.form.enable();
        } else {
          // Si es edición, habilitamos todo excepto código
          this.form.enable();
          this.form.get('codigo')?.disable();
        }
      }
    }
    if (changes['disabled']) {
      if (this.disabled) {
        this.form.disable();
      } else {
        this.form.enable();
        if (this.isEditing) {
           this.form.get('codigo')?.disable();
        }
      }
    }
  }

  get f() {
    return this.form.controls;
  }

  onNombreInput(value: string) {
    if (!this.categoria && !this.manualCodeEntry) {
      const code = value.replace(/\s/g, '').substring(0, 5).toUpperCase();
      this.form.patchValue({ codigo: code });
    }
  }

  onCodigoInput(value: string) {
    this.manualCodeEntry = true;
    if (value) {
      this.form.patchValue({ codigo: value.toUpperCase() }, { emitEvent: false });
    }
  }

  guardar() {
    this.internoSubmitted = true;
    this.onValidate.emit();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.enviando) {
      this.enviando = true;
      this.submitCategoria.emit(this.form.getRawValue());

      // Restablecer el estado enviando después de un tiempo límite
      setTimeout(() => {
        if (this.enviando) {
          console.warn('Tiempo de espera agotado. Restableciendo estado enviando.');
          this.enviando = false;
        }
      }, 1000); // 10 segundos como tiempo límite

      this.onError.subscribe(() => {
        this.enviando = false;
      });
    }
  }

  reset() {
    this.onReset.emit();
    this.form.reset();
  }

  handleEditarCategoria() {
    this.editarCategoria.emit();
    this.form.enable();
  }


}
