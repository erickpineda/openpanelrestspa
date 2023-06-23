export class EstadoEntrada {
  id: number = 0;
  nombre: string = "";
  descripcion: string = "";
  
  constructor() {

  }
}

export interface EstadoEntrada {
  id: number;
  nombre: string;
  descripcion: string;
}