
export class Categoria {
  idCategoria: number = 0;
  nombre: string = "";
  descripcion: string = "";
  cantidadEntradas: number = 0;

  constructor() {

  }
}

export interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion: string;
  cantidadEntradas: number;
}

