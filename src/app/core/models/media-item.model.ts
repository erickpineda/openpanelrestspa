export interface MediaItem {
  id?: number;
  nombre?: string;
  tipo?: 'image' | 'file';
  url?: string;
  tamano?: number;
  fechaCreacion?: string;
}

export interface MediaBuscarResponse {
  elements: MediaItem[];
  totalPages: number;
}
