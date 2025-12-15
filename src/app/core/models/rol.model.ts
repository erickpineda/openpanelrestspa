import { Privilegio } from "./privilegio.model";

export class Rol {
  idRol: number = 0;
  codigo: string = "";
  nombre: string = "";
  descripcion: string = "";
  privilegios: Privilegio[] = [];
  
  constructor() {

  }
}


export interface Rol {
  idRol: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  privilegios: Privilegio[];
}
