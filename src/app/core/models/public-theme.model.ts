export interface PublicTheme {
  slug: string;
  idTemaVersion?: number;
  version?: number;
  tokensJson: string;
  cssUrl?: string | null;
  assetsUrl?: string | null;
  // Opcional: usado por preview local / metadata preview (no necesariamente viene del backend)
  metadataJson?: string | null;
}
