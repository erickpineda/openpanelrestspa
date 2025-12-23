import { TokenStorageService } from './token-storage.service';
import {
  TAB_ID_KEY,
  TOKEN_KEY,
  USER_KEY,
  SYNC_TOKEN_KEY,
  SYNC_USER_KEY,
  POST_LOGIN_REDIRECT,
  POST_LOGIN_PREFIX,
} from './token-storage.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

describe('TokenStorageService', () => {
  let service: TokenStorageService;
  let log: jasmine.SpyObj<any>;

  beforeEach(() => {
    log = jasmine.createSpyObj('LoggerService', ['info', 'error']);
    service = new TokenStorageService(log);

    try {
      sessionStorage.removeItem(TAB_ID_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(SYNC_TOKEN_KEY);
      localStorage.removeItem(SYNC_USER_KEY);
      localStorage.removeItem(OPConstants.Session.AUTH_SYNC_KEY);
      localStorage.removeItem(OPConstants.Session.SESSION_ACTIVE_KEY);
      localStorage.removeItem(OPConstants.Session.SESSION_TIMESTAMP_KEY);
      localStorage.removeItem(POST_LOGIN_REDIRECT);
    } catch {}
  });

  it('getOrCreateTabId crea y persiste id en sessionStorage', () => {
    const id1 = service.getOrCreateTabId();
    const id2 = service.getOrCreateTabId();
    expect(id1).toBeTruthy();
    expect(id2).toBe(id1);
    expect(sessionStorage.getItem(TAB_ID_KEY)).toBe(id1);
  });

  it('saveToken y getToken sincronizan sessionStorage y localStorage', () => {
    service.saveToken('t');
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('t');
    expect(localStorage.getItem(SYNC_TOKEN_KEY)).toBe('t');
    expect(service.getToken()).toBe('t');
  });

  it('getToken cae a localStorage y rellena sessionStorage', () => {
    localStorage.setItem(SYNC_TOKEN_KEY, 't');
    sessionStorage.removeItem(TOKEN_KEY);
    expect(service.getToken()).toBe('t');
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('t');
  });

  it('saveUser y getUser sincronizan sessionStorage y localStorage', () => {
    const user = { id: 1 };
    service.saveUser(user);
    expect(JSON.parse(sessionStorage.getItem(USER_KEY) as string)).toEqual(
      user,
    );
    expect(JSON.parse(localStorage.getItem(SYNC_USER_KEY) as string)).toEqual(
      user,
    );
    expect(service.getUser()).toEqual(user);
  });

  it('signOut elimina claves de sesión y sincronización sin borrar tabId', () => {
    sessionStorage.setItem(TAB_ID_KEY, 'tab');
    sessionStorage.setItem(TOKEN_KEY, 't');
    sessionStorage.setItem(USER_KEY, '{"x":1}');
    localStorage.setItem(SYNC_TOKEN_KEY, 't');
    localStorage.setItem(SYNC_USER_KEY, '{"x":1}');
    localStorage.setItem(OPConstants.Session.AUTH_SYNC_KEY, 'x');
    localStorage.setItem(OPConstants.Session.SESSION_ACTIVE_KEY, 'x');
    localStorage.setItem(OPConstants.Session.SESSION_TIMESTAMP_KEY, 'x');

    service.signOut();

    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(USER_KEY)).toBeNull();
    expect(sessionStorage.getItem(TAB_ID_KEY)).toBe('tab');
    expect(localStorage.getItem(SYNC_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(SYNC_USER_KEY)).toBeNull();
    expect(localStorage.getItem(OPConstants.Session.AUTH_SYNC_KEY)).toBeNull();
    expect(
      localStorage.getItem(OPConstants.Session.SESSION_ACTIVE_KEY),
    ).toBeNull();
    expect(
      localStorage.getItem(OPConstants.Session.SESSION_TIMESTAMP_KEY),
    ).toBeNull();
  });

  it('getPostLoginRedirectBase expira y limpia cuando supera TTL', () => {
    const now = Date.now();
    spyOn(Date, 'now').and.returnValue(now);

    const oldIso = new Date(now - 25 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(POST_LOGIN_REDIRECT, `r|${oldIso}`);
    expect(service.getPostLoginRedirectBase()).toBeNull();
    expect(localStorage.getItem(POST_LOGIN_REDIRECT)).toBeNull();
  });

  it('cleanExpiredPostLoginRedirects limpia claves expiradas de prefijo', () => {
    const now = Date.now();
    spyOn(Date, 'now').and.returnValue(now);

    const oldIso = new Date(now - 25 * 60 * 60 * 1000).toISOString();
    sessionStorage.setItem(`${POST_LOGIN_PREFIX}a`, `x|${oldIso}`);
    sessionStorage.setItem(`${POST_LOGIN_PREFIX}b`, `y|${oldIso}`);
    localStorage.setItem(POST_LOGIN_REDIRECT, `z|${oldIso}`);

    service.cleanExpiredPostLoginRedirects();

    expect(sessionStorage.getItem(`${POST_LOGIN_PREFIX}a`)).toBeNull();
    expect(sessionStorage.getItem(`${POST_LOGIN_PREFIX}b`)).toBeNull();
    expect(localStorage.getItem(POST_LOGIN_REDIRECT)).toBeNull();
  });
});
