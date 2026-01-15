export class Categoria {
  idCategoria: number = 0;
  codigo: string = '';
  nombre: string = '';
  descripcion: string = '';
  cantidadEntradas: number = 0;

  constructor() {}
}

export interface Categoria {
  idCategoria: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  cantidadEntradas: number;
}
