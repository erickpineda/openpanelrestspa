export class PerfilResponse {
  idUsuario: number = 0;
  rolCodigo: string = '';
  username: string = '';
  password: string = '';
  nombre: string = '';
  apellido: string = '';
  fechaNacimiento: any;
  email: string = '';
  genero: string = '';
  telefono: number = 0;
  emailConfirmado: boolean = false;
  website: string = '';
  imagen: string[] = [];
  infouser: string = '';
}

export interface PerfilResponse {
  idUsuario: number;
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
  website: string;
  imagen: string[];
  infouser: string;
}
