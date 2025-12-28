import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comentario } from '../../../../core/models/comentario.model';

@Component({
  selector: 'app-comentario-form',
  templateUrl: './comentario-form.component.html',
  styleUrls: ['./comentario-form.component.scss'],
  standalone: false,
})
export class ComentarioFormComponent implements OnChanges {
  @Input() comentario?: Comentario;
  @Input() nombreUsuario?: string;
  @Input() emailUsuario?: string;
  @Input() tituloEntrada?: string;

  @Input() submitted = false;
  @Input() disabled = false; // Para modo ver/editar
  @Input() isEditMode = false; // Para saber si estamos en modo edición (vs crear)

  @Output() submitComentario = new EventEmitter<Comentario>();
  @Output() cancel = new EventEmitter<void>();
  @Output() editarComentario = new EventEmitter<void>(); // Solicitud de habilitar edición

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      idComentario: [null],
      idEntrada: [null],
      idUsuario: [null],
      username: [null], // Readonly display
      tituloEntrada: [null], // Readonly display
      email: [null], // Readonly display
      aprobado: [false],
      cuarentena: [false],
      votos: [null],
      fechaCreacion: [null],
      fechaEdicion: [null],
      contenido: [null, Validators.required],
      contenidoCensurado: [null],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['comentario'] && this.comentario) {
      this.form.patchValue(this.comentario);
    }

    if (changes['nombreUsuario'] && this.nombreUsuario) {
      this.form.get('username')?.setValue(this.nombreUsuario);
    }

    if (changes['emailUsuario'] && this.emailUsuario) {
      this.form.get('email')?.setValue(this.emailUsuario);
    }

    if (changes['tituloEntrada'] && this.tituloEntrada) {
      this.form.get('tituloEntrada')?.setValue(this.tituloEntrada);
    }

    if (changes['disabled']) {
      if (this.disabled) {
        this.form.disable();
      } else {
        this.form.enable();
        // Si estamos editando, quizás queramos mantener ciertos campos deshabilitados
        // como username, email, fechas, etc.
        // Pero por ahora enable() habilita todo, luego deshabilitamos lo que no se debe tocar
        this.disableReadonlyFields();
      }
    }
  }

  private disableReadonlyFields() {
    const readonlyFields = [
      'username',
      'email',
      'tituloEntrada',
      'votos',
      'fechaCreacion',
      'fechaEdicion',
      'idComentario',
      'idEntrada',
      'idUsuario',
    ];
    readonlyFields.forEach((field) => {
      this.form.get(field)?.disable();
    });
    // En CrearEditarComentario: this.comentarioForm.controls['contenidoCensurado'].disable();
    // Al editar se deshabilita contenidoCensurado?
    // "this.comentarioForm.controls['contenidoCensurado'].disable();" estaba en editarComentario()
    if (this.isEditMode) {
      this.form.get('contenidoCensurado')?.disable();
    }
  }

  get f() {
    return this.form.controls;
  }

  guardar() {
    if (this.form.valid) {
      // Emitimos el valor del form, mezclado con el ID original si es necesario
      // Ojo: getRawValue() incluye los campos deshabilitados
      const formValue = this.form.getRawValue();
      this.submitComentario.emit(formValue);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  handleEditarComentario() {
    this.editarComentario.emit();
    this.form.enable();
    this.disableReadonlyFields();
  }
}
