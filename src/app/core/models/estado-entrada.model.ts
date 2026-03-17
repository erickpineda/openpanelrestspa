export interface EstadoEntrada {
  nombre: string;
  descripcion: string;
  codigo: string;
}

export class EstadoEntrada implements EstadoEntrada {
  nombre: string = '';
  descripcion: string = '';
  codigo: string = '';

  constructor(init?: Partial<EstadoEntrada>) {
    Object.assign(this, init);
  }
}
