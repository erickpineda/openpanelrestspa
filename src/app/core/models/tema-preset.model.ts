export interface TemaPreset {
  idTemaPreset?: number;
  nombre: string;
  descripcion?: string;
  tokensJson: string;
  metadataJson?: string;
  isSystem?: boolean;
  tags?: string; // CSV
  fechaCreacion?: string | Date;
  fechaUltimaModif?: string | Date;
}
