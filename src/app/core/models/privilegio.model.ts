export class Privilegio {
  idPrivilegio: number = 0;
  nombre: string = "";
  descripcion: string = "";

  constructor() {}
}

export interface Privilegio {
  idPrivilegio: number;
  nombre: string;
  descripcion: string;
}
