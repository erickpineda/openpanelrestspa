import { Categoria } from "./categoria.model";
import { EstadoEntrada } from "./estado-entrada.model";
import { Etiqueta } from "./etiqueta.model";
import { TipoEntrada } from "./tipo-entrada.model";
import { Usuario } from "./usuario.model";

export class Entrada {
  id: number = 0;
  titulo: string = "";
  contenido: string = "";
  tipoEntrada: TipoEntrada = new TipoEntrada;
  resumen: string = "";
  fechaPublicacion: Date = new Date();
  fechaEdicion: Date = new Date();
  borrador: boolean = false;
  publicada: boolean = false;
  password: string = "";
  privado: boolean = false;
  estado: EstadoEntrada = new EstadoEntrada();
  permitirComentario: boolean = true;
  imagenDestacada: string = "";
  votos: number = 0;
  cantidadComentarios: number = 0;
  usuario: Usuario = new Usuario;
  usuarioEditado: number = 0;
  categorias: Categoria[] = [];
  categoriasConComas: string = '';
  etiquetas: Etiqueta[] = [];

  constructor() {

  }

}

export interface Entrada {
  id: number;
  titulo: string;
  contenido: string;
  tipoEntrada: TipoEntrada;
  resumen: string;
  fechaPublicacion: Date;
  fechaEdicion: Date;
  borrador: boolean;
  publicada: boolean;
  password: string;
  privado: boolean;
  estado: EstadoEntrada;
  permitirComentario: boolean;
  imagenDestacada: string;
  votos: number;
  cantidadComentarios: number;
  usuario: Usuario;
  usuarioEditado: number;
  categorias: Categoria[];
  categoriasConComas: string;
  etiquetas: Etiqueta[];

}

