export let base = {
  mock: true,
  getSessionInfo: false,
  production: false,
  i18n: 'es',
  getApiConsumerCredentials: false,
  apiConsumerCredentials: null,
  users: null,
  backend: {
    host: 'http://localhost:8080',
    uri: '/api/v1',
    applicationId: '1234567890',
    timeoutThreshold: 0.9,
  },
};
