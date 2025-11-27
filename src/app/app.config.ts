import { environment } from '../environments/environment.dev.es';

export const APP_CONFIG = {
  api: {
    baseUrl: environment.backend.host + environment.backend.uri,
    endpoints: {
      auth: '/auth',
      entradas: '/entradas',
      usuarios: '/usuarios',
      categorias: '/categorias',
      comentarios: '/comentarios'
    }
  },
  features: {
    enableTemporaryStorage: true,
    enableAutoSave: false,
    maxFileUploadSize: 5 * 1024 * 1024 // 5MB
  },
  ui: {
    defaultPageSize: 10,
    maxPageSize: 100,
    debounceTime: 300
  }
} as const;