import { OPRestApiConstants, OPRestMethods } from './op-restapi.constants';

export const OPConstants: any = {
  API: OPRestApiConstants,
  Methods: OPRestMethods,
  Session: {
    // Prefijos y claves de storage
    POST_LOGIN_PREFIX: 'post-login-redirect-',
    TAB_ID_KEY: 'op-tab-id',
    TOKEN_KEY: 'auth-token',
    USER_KEY: 'auth-user',
    SYNC_TOKEN_KEY: 'sync-auth-token',
    SYNC_USER_KEY: 'sync-auth-user',
    // Rutas especiales del flujo de sesión/post-login
    ROUTE_LOGIN: '/login',
    ROUTE_SESSION_EXPIRED: '/session-expired',
    ROUTE_HOME: '/',
    // Otros identificadores relevantes
    POST_LOGIN_HANDLED_PREFIX: 'post-login-handled-',
    // Ventana de protección anti-race (ms)
    IGNORE_WINDOW_MS: 1000,
  },
};
