import { Injectable } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidationEntradaFormsService {
  // Reglas que ya tenías en tu servicio original
  formRules = {
    nonEmpty: '^[a-zA-Z0-9]+([_ -]?[a-zA-Z0-9])*$',
    tituloFormato: '[a-zA-Z ]{1,254}',
    tituloMin: 1,
    tituloMax: 150,
    subtituloFormato: '[a-zA-Z ]{1,254}',
    subtituloMax: 200,
    contenidoMin: 1,
  };

  // Mensajes de error (puedes mantener los tuyos)
  errorMessages = {
    titulo: {
      required: 'El título es obligatorio',
      minlength: `El título debe tener al menos ${this.formRules.tituloMin} caracteres`,
      maxlength: `El título no puede exceder ${this.formRules.tituloMax} caracteres`
    },
    subtitulo: {
      maxLength: `El subtítulo ha de tener máximo ${this.formRules.subtituloMax} caracteres`,
    },
    textoContenidoEntrada: {
      required: 'El texto del contenido de la entrada es obligatorio',
      minLength: `Escribe algo no seas vago`,
    },
    contenido: {
      required: 'Escribe algo en la entrada'
    }
  };

  formErrors = {
    titulo: '',
    subtitulo: '',
    textoContenidoEntrada: ''
  };

  constructor(private fb: UntypedFormBuilder) {}

  // buildForm() crea y devuelve el FormGroup listo para usar.
  public buildForm(): UntypedFormGroup {
    return this.fb.group({
      idEntrada: [null],
      idUsuario: [null],
      idUsuarioEditado: [null],
      titulo: ['', [
        Validators.required,
        Validators.minLength(this.formRules.tituloMin),
        Validators.maxLength(this.formRules.tituloMax)
      ]],
      subtitulo: ['', [
        Validators.maxLength(this.formRules.subtituloMax)
      ]],
      contenido: ['', [
        Validators.required,
        Validators.minLength(this.formRules.contenidoMin)
      ]],
      notas: [null],
      tipoEntrada: [null, [Validators.required]],
      resumen: [null],
      fechaPublicacion: [null],
      fechaEdicion: [null],
      borrador: [true],
      publicada: [false],
      password: [null],
      privado: [false],
      estadoEntrada: [null, [Validators.required]],
      fechaPublicacionProgramada: [null],
      permitirComentario: [true],
      imagenDestacada: [null],
      votos: [0],
      cantidadComentarios: [0],
      categorias: this.fb.array([]), // <-- FormArray para categorías
      categoriasConComas: [''],
      etiquetas: [[]],
    });
  }
}
