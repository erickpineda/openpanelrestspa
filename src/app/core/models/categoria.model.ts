export class Categoria {
  codigo: string = '';
  nombre: string = '';
  descripcion: string = '';
  cantidadEntradas: number = 0;

  constructor() {}
}

export interface Categoria {
  codigo: string;
  nombre: string;
  descripcion: string;
  cantidadEntradas: number;
}
