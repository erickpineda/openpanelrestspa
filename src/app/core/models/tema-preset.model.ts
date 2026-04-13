export interface TemaPreset {
  idTemaPreset?: number;
  nombre: string;
  descripcion?: string;
  tokensJson: string;
  metadataJson?: string;
  fechaCreacion?: string | Date;
  fechaUltimaModif?: string | Date;
}

