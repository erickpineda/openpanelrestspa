export class TipoEntrada {
  nombre: string = '';
  codigo: string = '';
  descripcion: string = '';

  constructor() {}
}

export interface TipoEntrada {
  nombre: string;
  codigo: string;
  descripcion: string;
}
