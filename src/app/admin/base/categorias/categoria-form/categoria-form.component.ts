import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Categoria } from '../../../../core/models/categoria.model';

@Component({
  selector: 'app-categoria-form',
  styleUrls: ['./categoria-form.component.scss'],
  templateUrl: './categoria-form.component.html',
})
export class CategoriaFormComponent implements OnChanges {
  @Input() categoria?: Categoria;
  @Input() listaCategorias: Categoria[] = [];
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
  // Lista usada en la vista con un conteo ficticio de entradas cuando no existe
  displayListaCategorias: Categoria[] = [];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      idCategoria: [null],
      nombre: [null, Validators.required],
      descripcion: [null],
      cantidadEntradas: [0]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoria'] && this.categoria) {
      this.form.patchValue(this.categoria);
      if (this.disabled) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    }
    if (changes['disabled']) {
      if (this.disabled) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    }
    if (changes['listaCategorias']) {
      const list = Array.isArray(this.listaCategorias) ? this.listaCategorias : [];
      this.displayListaCategorias = this.assignDummyCounts(list);
    }
  }

  get f() {
    return this.form.controls;
  }

  guardar() {
    this.onValidate.emit();
    if (this.form.valid && !this.enviando) {
      this.enviando = true;
      this.submitCategoria.emit(this.form.value);

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

  private assignDummyCounts(list: Categoria[]): Categoria[] {
    return list.map(c => {
      // Mantener valor real si existe; si no, asignar un número ficticio pequeño (1-5)
      const cantidad = (c as any).cantidadEntradas ?? Math.floor(Math.random() * 5) + 1;
      return { ...c, cantidadEntradas: cantidad } as Categoria;
    });
  }
}
