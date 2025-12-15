export class Privilegio {
  idPrivilegio: number = 0;
  codigo: string = "";
  nombre: string = "";
  descripcion: string = "";
  
  constructor() {}
}

export interface Privilegio {
  idPrivilegio: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}
