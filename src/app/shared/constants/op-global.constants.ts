import { OPRestApiConstants, OPRestMethods } from './op-restapi.constants';

export const OPConstants = {
  API: OPRestApiConstants,
  Methods: OPRestMethods,
  Session: {
    // Prefijos y claves de storage
    POST_LOGIN_PREFIX: 'post-login-redirect-',
    POST_LOGIN_REDIRECT: 'post-login-redirect',
    TAB_ID_KEY: 'op-tab-id',
    TOKEN_KEY: 'auth-token',
    USER_KEY: 'auth-user',
    SYNC_TOKEN_KEY: 'sync-auth-token',
    SYNC_USER_KEY: 'sync-auth-user',
    AUTH_SYNC_KEY: 'auth-sync',
    AUTH_SYNC_CHANNEL: 'auth-sync-channel',
    SESSION_ACTIVE_KEY: 'session-active',
    SESSION_TIMESTAMP_KEY: 'session-timestamp',
    // Rutas especiales del flujo de sesión/post-login
    ROUTE_LOGIN: '/login',
    ROUTE_SESSION_EXPIRED: '/session-expired',
    ROUTE_HOME: '/',
    // Otros identificadores relevantes
    POST_LOGIN_HANDLED_PREFIX: 'post-login-handled-',
    // Ventana de protección anti-race (ms)
    IGNORE_WINDOW_MS: 1000,
  },
  Storage: {
    UNSAVED_FORMS_KEY: 'unsaved-forms',
    DASH_METRICS_EXPANDED_KEY: 'dash_metrics_expanded',
    DASH_FORCE_DB_KEY: 'dash_force_db',
  },
  Events: {
    AUTH_LOGIN: 'auth:login',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_CHANGED: 'auth:changed',
    AUTH_STATE_CHANGED: 'authStateChanged',
    SAVE_UNSAVED_WORK: 'saveUnsavedWork',
    SAVE_WORK_BEFORE_LOGOUT: 'saveWorkBeforeLogout',
    SAVE_FORM_DATA: 'saveFormData',
  },
  Sync: {
    TYPE_LOGIN: 'auth:sync:login',
    TYPE_LOGOUT: 'auth:sync:logout',
    TYPE_CHANGED: 'auth:sync:changed'
  },
  Pagination: {
    PAGE_NO_PARAM: 'pageNo',
    PAGE_SIZE_PARAM: 'pageSize',
    DEFAULT_PAGE_SIZE: 10
  },
  Roles: {
    PROPIETARIO: 1,
    ADMINISTRADOR: 2,
    MANTENIMIENTO: 3,
    EDITOR: 4,
    DESARROLLADOR: 5,
    AUTOR: 6,
    LECTOR: 7
  }
} as const;
