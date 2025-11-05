import { Injectable } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray } from '@angular/forms';
import { EstadoEntrada } from '../../../../../core/models/estado-entrada.model';
import { TipoEntrada } from '../../../../../core/models/tipo-entrada.model';

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
  public buildForm(entrada?: any): UntypedFormGroup {
    return this.fb.group({
      idEntrada: [entrada?.idEntrada ?? null],
      idUsuario: [entrada?.idUsuario ?? null],
      idUsuarioEditado: [entrada?.idUsuarioEditado ?? null],
      titulo: [entrada?.titulo ?? '', [
        Validators.required,
        Validators.minLength(this.formRules.tituloMin),
        Validators.maxLength(this.formRules.tituloMax)
      ]],
      subtitulo: [entrada?.subtitulo ?? '', [
        Validators.maxLength(this.formRules.subtituloMax)
      ]],
      contenido: [entrada?.contenido ?? '', [
        Validators.required,
        Validators.minLength(this.formRules.contenidoMin)
      ]],
      notas: [entrada?.notas ?? null],
      tipoEntrada: [entrada?.tipoEntrada ?? TipoEntrada, [Validators.required]],
      resumen: [entrada?.resumen ?? null],
      fechaPublicacion: [entrada?.fechaPublicacion ?? null],
      fechaEdicion: [entrada?.fechaEdicion ?? null],
      borrador: [entrada?.borrador ?? true],
      publicada: [entrada?.publicada ?? false],
      password: [entrada?.password ?? null],
      privado: [entrada?.privado ?? false],
      estadoEntrada: [entrada?.estadoEntrada ?? EstadoEntrada, [Validators.required]],
      fechaPublicacionProgramada: [entrada?.fechaPublicacionProgramada ?? null],
      permitirComentario: [entrada?.permitirComentario ?? true],
      imagenDestacada: [entrada?.imagenDestacada ?? null],
      votos: [entrada?.votos ?? 0],
      cantidadComentarios: [entrada?.cantidadComentarios ?? 0],
      categorias: this.fb.array(entrada?.categorias ? entrada.categorias.map((c: any) => this.fb.control(c)) : []),
      categoriasConComas: [entrada?.categoriasConComas ?? ''],
      etiquetas: [entrada?.etiquetas ?? []],
    });
  }

}
