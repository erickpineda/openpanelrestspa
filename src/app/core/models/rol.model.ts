import { Privilegio } from "./privilegio.model";

export class Rol {
  idRol: number = 0;
  nombre: string = "";
  descripcion: string = "";
  privilegios: Privilegio[] = [];
  
  constructor() {

  }
}


export interface Rol {
  idRol: number;
  nombre: string;
  descripcion: string;
  privilegios: Privilegio[];
}
