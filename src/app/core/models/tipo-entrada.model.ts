export class TipoEntrada {
  id: number = 0;
  nombre: string = "";
  descripcion: string = "";
  
  constructor() {

  }
}

export interface TipoEntrada {
  id: number;
  nombre: string;
  descripcion: string;
}