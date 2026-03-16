import { Entrada } from './entrada.model';
import { Usuario } from './usuario.model';

export class Comentario {
  idComentario: number = 0;
  idUsuario: number = 0;
  idEntrada: number = 0;
  fechaCreacion: Date = new Date();
  fechaEdicion: Date = new Date();
  contenido: string = '';
  contenidoCensurado: string = '';
  votos: number = 0;
  aprobado: boolean = true;
  cuarentena: boolean = false;

  // Fuera del backend
  username: string = '';
  tituloEntrada: string = '';
  fechaCreacionParseada: string = '';
  entradaSlug?: string;
  slugEntrada?: string;

  constructor() {}
}

export interface Comentario {
  idComentario: number;
  idUsuario: number;
  idEntrada: number;
  fechaCreacion: Date;
  fechaEdicion: Date;
  contenido: string;
  contenidoCensurado: string;
  votos: number;
  aprobado: boolean;
  cuarentena: boolean;

  // Fuera del backend
  username: string;
  tituloEntrada: string;
  fechaCreacionParseada: string;
  entradaSlug?: string;
  slugEntrada?: string;
}
