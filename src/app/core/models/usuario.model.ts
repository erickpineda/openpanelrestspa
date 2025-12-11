import { Comentario } from "./comentario.model";
import { Entrada } from "./entrada.model";
import { Rol } from "./rol.model";

export class Usuario {
  idUsuario: number = 0;
  idRol: number = 0;
  rolCodigo: string = "";
  username: string = "";
  password: string = "";
  nombre: string = "";
  apellido: string = "";
  fechaNacimiento: any;
  email: string = "";
  genero: string = "";
  telefono: number = 0;
  emailConfirmado: boolean = false;
  fechaEmailConfirmado: any;
  website: string = "";
  imagen: string[] = [];
  infouser: string = "";
  tokenExpirationDate: any;
  verifyToken: string = "";
  //refreshToken
  //deviceMetadata

  constructor() {

  }
}

export interface Usuario {
  idUsuario: number;
  idRol: number;
  rolCodigo: string;
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: any;
  email: string;
  genero: string;
  telefono: number;
  emailConfirmado: boolean;
  fechaEmailConfirmado: any;
  website: string;
  imagen: string[];
  infouser: string;
  tokenExpirationDate: any;
  verifyToken: string;
}
