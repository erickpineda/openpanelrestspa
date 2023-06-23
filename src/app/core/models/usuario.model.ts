import { Comentario } from "./comentario.model";
import { Entrada } from "./entrada.model";
import { Rol } from "./rol.model";

export class Usuario {
  id: number = 0;
  rol: Rol = new Rol;
  username: string = "";
  password: string = "";
  nombre: string = "";
  apellido: string = "";
  fechaNacimiento: any;
  email: string = "";
  genero: string = "";
  telefono: number = 0;
  emailConfirmado: boolean = false;
  website: string = "";
  imagen: string[] = [];
  infouser: string = "";

  constructor() {

  }
}

export interface Usuario {
  id: number;
  rol: Rol;
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: any;
  email: string;
  genero: string;
  telefono: number;
  emailConfirmado: boolean;
  website: string;
  imagen: string[];
  infouser: string;
}
