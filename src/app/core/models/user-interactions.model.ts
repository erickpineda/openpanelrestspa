export interface UserInteractionsResponse {
  bookmarksSlugs: string[];
  votosSlugs: string[];
  suscripciones: {
    categoriasCodigos: string[];
    etiquetasCodigos: string[];
  };
  preferencias: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'normal' | 'medium' | 'large';
  } | null;
}
