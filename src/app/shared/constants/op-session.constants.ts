export const OPSessionConstants = {
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
  // Tipos de expiración/cierre de sesión
  TYPE_SESSION_EXPIRED: 'SESSION_EXPIRED',
  TYPE_LOGOUT: 'LOGOUT',
  TYPE_ANOTHER_DEVICE: 'ANOTHER_DEVICE',
  // Otros identificadores relevantes
  POST_LOGIN_HANDLED_PREFIX: 'post-login-handled-',
  // Ventana de protección anti-race (ms)
  IGNORE_WINDOW_MS: 1000,
  // Límite y expiración de registros post-login en almacenamiento
  POST_LOGIN_MAX_ENTRIES: 50,
  POST_LOGIN_MAX_AGE_DAYS: 1,
};
