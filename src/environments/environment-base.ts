import { OPConstants } from "../app/shared/constants/op-global.constants";

export let base = {
    mock: true,
    getSessionInfo: false,
    production: false,
    i18n: 'es',
    getApiConsumerCredentials: false,
    apiConsumerCredentials: null,
    users: null,
    backend: {
        host: OPConstants.API.HOST,
        uri: OPConstants.API.BASE_URL,
        applicationId: '1234567890',
        timeoutThreshold: 0.9
    }
};
