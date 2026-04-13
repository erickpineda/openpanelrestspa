export interface TemaVersionSummary {
  idTemaVersion?: number;
  version?: number;
  state?: 'DRAFT' | 'PUBLISHED' | string;
  publishedAt?: string | Date;
  publishedBy?: string;
}

export interface Tema {
  idTema?: number;
  slug: string;
  nombre: string;
  descripcion?: string;
  origen?: 'BUILT_IN' | 'UPLOADED' | string;

  published?: TemaVersionSummary | null;
  draft?: TemaVersionSummary | null;

  fechaCreacion?: string | Date;
  usuarioCreacion?: string;
  fechaUltimaModif?: string | Date;
  usuarioUltimaModif?: string;
}

export interface TemaDraftRequest {
  tokensJson: string;
  metadataJson?: string;
}

export interface TemaPreviewTokenResponse {
  previewToken: string;
  expiresAt: string | Date;
  previewUrl: string;
}

export interface TemaDraft {
  slug: string;
  idTemaVersion?: number;
  version?: number;
  state?: string;
  sourceType?: 'TOKENS_ONLY' | 'CSS_PACKAGE' | string;
  tokensJson?: string | null;
  metadataJson?: string | null;
  cssUuid?: string | null;
  assetsUuid?: string | null;
  checksum?: string | null;
  packageSizeKb?: number | null;
}
