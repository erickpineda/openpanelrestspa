export class TipoEntrada {
  idTipoEntrada: number = 0;
  nombre: string = '';
  codigo: string = '';
  descripcion: string = '';

  constructor() {}
}

export interface TipoEntrada {
  idTipoEntrada: number;
  nombre: string;
  codigo: string;
  descripcion: string;
}
