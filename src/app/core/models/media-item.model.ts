export interface MediaItem {
  id?: number;
  uuid?: string;
  nombre?: string;
  tipo?: 'image' | 'file';
  mime?: string;
  url?: string;
  tamano?: number;
  fechaCreacion?: string;
}

export interface MediaBuscarResponse {
  elements: MediaItem[];
  totalPages: number;
}
