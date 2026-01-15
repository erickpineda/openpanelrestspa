export class Etiqueta {
  idEtiqueta: number = 0;
  codigo: string = '';
  nombre: string = '';
  frecuencia: number = 0;
  descripcion: string = '';
  colorHex: string = '';

  constructor() {}
}

export interface Etiqueta {
  idEtiqueta: number;
  codigo: string;
  nombre: string;
  frecuencia: number;
  descripcion: string;
  colorHex: string;
}
