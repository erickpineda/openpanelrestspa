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
    tituloMax: 100,
    contenidoMin: 1,
  };

  formErrors = {
    titulo: '',
    textoContenidoEntrada: ''
  };

  constructor() {
    this.errorMessages = {
      titulo: {
        required: 'El título es obligatorio',
        minLength: `El título ha de tener ${this.formRules.tituloMin} caracter o más`,
        maxLength: `El título ha de tener máximo ${this.formRules.tituloMax} caracteres`,
      },
      textoContenidoEntrada: {
        required: 'El texto del contenido de la entrada es obligatorio',
        minLength: `Escribe algo no seas vago`,
      },
    };
  }
}