import { Privilegio } from './privilegio.model';

export class Rol {
  codigo: string = '';
  nombre: string = '';
  descripcion: string = '';
  privilegios: Privilegio[] = [];

  constructor() {}
}

export interface Rol {
  codigo: string;
  nombre: string;
  descripcion: string;
  privilegios: Privilegio[];
}
