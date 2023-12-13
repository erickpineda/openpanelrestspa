import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationEntradaFormsService {

  errorMessages: any;

  formRules = {
    nonEmpty: '^[a-zA-Z0-9]+([_ -]?[a-zA-Z0-9])*$',
    tituloFormato: '[a-zA-Z ]{1,254}',
    tituloMin: 1,
    tituloMax: 150,
    subtituloFormato: '[a-zA-Z ]{1,254}',
    subtituloMax: 200,
    contenidoMin: 1,
  };

  formErrors = {
    titulo: '',
    subtitulo: '',
    textoContenidoEntrada: ''
  };

  constructor() {
    this.errorMessages = {
      titulo: {
        required: 'El título es obligatorio',
        minLength: `El título ha de tener ${this.formRules.tituloMin} caracter o más`,
        maxLength: `El título ha de tener máximo ${this.formRules.tituloMax} caracteres`,
      },
      subtitulo: {
        maxLength: `El subtítulo ha de tener máximo ${this.formRules.subtituloMax} caracteres`,
      },
      textoContenidoEntrada: {
        required: 'El texto del contenido de la entrada es obligatorio',
        minLength: `Escribe algo no seas vago`,
      },
    };
  }
}