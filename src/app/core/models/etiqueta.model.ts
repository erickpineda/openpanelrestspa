
export class Etiqueta {
  id: number = 0;
  nombre: string = "";
  frecuencia: number = 0;
  descripcion: string = "";
  
  constructor() {

  }
}

export interface Etiqueta {
  id: number;
  nombre: string;
  frecuencia: number;
  descripcion: string;
}