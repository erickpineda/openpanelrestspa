export interface ActivityPointDTO {
  date: string; // YYYY-MM-DD
  entradas: number;
  comentarios: number;
  usuarios: number;
}

export interface TopItemDTO {
  name: string;
  count: number;
}

export interface SummaryEntryDTO {
  id: number;
  titulo: string;
  fechaCreacion: string;
  idUsuario: number;
  estado: string;
}

export interface SummaryCommentDTO {
  id: number;
  contenidoCorto: string;
  fechaCreacion: string;
  idUsuario: number;
  idEntrada: number;
}

export interface SummaryUserDTO {
  id: number;
  username: string;
  email: string;
  fechaRegistro: string;
}

export interface SummaryDTO {
  totalUsuarios: number;
  totalEntradas: number;
  totalComentarios: number;
  totalFicheros: number;
  storageBytes: number;
  ultimasEntradas: SummaryEntryDTO[];
  ultimosComentarios: SummaryCommentDTO[];
  ultimosUsuarios: SummaryUserDTO[];
}

export interface StorageDTO {
  totalFiles: number;
  storageBytes: number;
}

export interface ContentStatsDTO {
  totalUsuarios: number;
  totalEntradas: number;
  totalComentarios: number;
  totalFicheros: number;
  storageBytes: number;
  entradasByEstado: { [estado: string]: number };
}
