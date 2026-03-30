import { Categoria } from '@app/core/models/categoria.model';
import { Etiqueta } from '@app/core/models/etiqueta.model';

export interface PublicEntradaVM {
  idEntrada: number;
  slug: string;
  titulo: string;
  subtitulo: string;
  resumen: string;
  contenido: string;
  fechaPublicacion: Date;
  imagenDestacadaUuid?: string;
  categorias: Categoria[];
  etiquetas: Etiqueta[];
  usernameCreador: string;
}
