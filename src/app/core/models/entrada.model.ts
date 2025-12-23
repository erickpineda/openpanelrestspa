import { Categoria } from './categoria.model';
import { EstadoEntrada } from './estado-entrada.model';
import { Etiqueta } from './etiqueta.model';
import { TipoEntrada } from './tipo-entrada.model';
import { Usuario } from './usuario.model';

export class Entrada {
  idEntrada: number = 0;
  idUsuario: number = 0;
  idUsuarioEditado: number = 0;
  titulo: string = '';
  subtitulo: string = '';
  contenido: string = '';
  notas: string = '';
  tipoEntrada: TipoEntrada = new TipoEntrada();
  resumen: string = '';
  fechaPublicacion: Date = new Date();
  fechaEdicion: Date = new Date();
  borrador: boolean = false;
  publicada: boolean = false;
  password: string = '';
  privado: boolean = false;
  estadoEntrada: EstadoEntrada = new EstadoEntrada();
  fechaPublicacionProgramada: Date = new Date();
  permitirComentario: boolean = true;
  imagenDestacada: string = '';
  votos: number = 0;
  cantidadComentarios: number = 0;
  categorias: Categoria[] = [];
  etiquetas: Etiqueta[] = [];

  // Fuera del backend
  categoriasConComas: string = '';
  usernameCreador: string = '';
  usernameModificador: string = '';

  constructor() {}
}

export interface Entrada {
  idEntrada: number;
  idUsuario: number;
  idUsuarioEditado: number;
  titulo: string;
  subtitulo: string;
  contenido: string;
  notas: string;
  tipoEntrada: TipoEntrada;
  resumen: string;
  fechaPublicacion: Date;
  fechaEdicion: Date;
  borrador: boolean;
  publicada: boolean;
  password: string;
  privado: boolean;
  estadoEntrada: EstadoEntrada;
  fechaPublicacionProgramada: Date;
  permitirComentario: boolean;
  imagenDestacada: string;
  votos: number;
  cantidadComentarios: number;

  categorias: Categoria[];
  etiquetas: Etiqueta[];

  // Fuera del backend
  categoriasConComas: string;
  usernameCreador: string;
  usernameModificador: string;
}

export interface EntradaFormData {
  titulo: string;
  contenido: string;
  resumen: string;
  categorias: Categoria[];
  estadoEntrada: EstadoEntrada;
}
