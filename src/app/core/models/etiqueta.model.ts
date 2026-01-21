export class Etiqueta {
  codigo: string = '';
  nombre: string = '';
  frecuencia: number = 0;
  descripcion: string = '';
  colorHex: string = '';

  constructor() {}
}

export interface Etiqueta {
  codigo: string;
  nombre: string;
  frecuencia: number;
  descripcion: string;
  colorHex: string;
}
