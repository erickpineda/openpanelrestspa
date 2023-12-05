export class EstadoEntrada {
  idEstadoEntrada: number = 0;
  nombre: string = "";
  descripcion: string = "";
  
  constructor() {

  }
}

export interface EstadoEntrada {
  idEstadoEntrada: number;
  nombre: string;
  descripcion: string;
}