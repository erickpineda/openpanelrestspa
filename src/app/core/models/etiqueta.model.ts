export class Etiqueta {
  idEtiqueta: number = 0;
  nombre: string = '';
  frecuencia: number = 0;
  descripcion: string = '';
  colorHex: string = '';

  constructor() {}
}

export interface Etiqueta {
  idEtiqueta: number;
  nombre: string;
  frecuencia: number;
  descripcion: string;
  colorHex: string;
}
