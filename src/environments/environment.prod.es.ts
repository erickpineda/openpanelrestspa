import { base } from './environment-base';

base.backend.host = '/api/v1';
base.backend.uri = '';
base.production = true;

base.mock = false;
base.getSessionInfo = true;
base.getApiConsumerCredentials = true;

export const environment = base;

export { base };
