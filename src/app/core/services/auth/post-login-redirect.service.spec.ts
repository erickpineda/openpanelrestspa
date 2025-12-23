import { PostLoginRedirectService } from './post-login-redirect.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

describe('PostLoginRedirectService', () => {
  let service: PostLoginRedirectService;
  let tokenStorage: any;

  beforeEach(() => {
    tokenStorage = { getOrCreateTabId: () => 'tab' };
    service = new PostLoginRedirectService(tokenStorage);

    try {
      sessionStorage.clear();
      localStorage.removeItem(OPConstants.Session.POST_LOGIN_REDIRECT);
      localStorage.removeItem(`${OPConstants.Session.POST_LOGIN_PREFIX}tab`);
    } catch {}
  });

  it('saveLastValidRoute guarda en sessionStorage y localStorage', () => {
    service.saveLastValidRoute('/admin/x');
    expect(sessionStorage.getItem('post-login-redirect-tab')).toBe('/admin/x');
    expect(localStorage.getItem('post-login-redirect-tab')).toBe('/admin/x');
  });

  it('getAndClearRedirectForTab lee y limpia storage', () => {
    sessionStorage.setItem('post-login-redirect-tab', '/admin/x');
    expect(service.getAndClearRedirectForTab()).toBe('/admin/x');
    expect(sessionStorage.getItem('post-login-redirect-tab')).toBeNull();
  });

  it('getAndClearRedirectForTab cae a POST_LOGIN_REDIRECT y limpia clave base', () => {
    localStorage.setItem(OPConstants.Session.POST_LOGIN_REDIRECT, '/admin/y');
    expect(service.getAndClearRedirectForTab()).toBe('/admin/y');
    expect(
      localStorage.getItem(OPConstants.Session.POST_LOGIN_REDIRECT),
    ).toBeNull();
  });

  it('normalizeRoute soporta HashLocationStrategy y rutas relativas', () => {
    expect(service.normalizeRoute('/a')).toBe('/a');
    expect(service.normalizeRoute('/#b')).toBe('/b');
    expect(service.normalizeRoute('c')).toBe('/c');
    expect(service.normalizeRoute('')).toBe('/');
  });

  it('markPostLoginHandled y shouldIgnoreRouteSave respetan ventana de ignorar', () => {
    const now = Date.now();
    spyOn(Date, 'now').and.returnValue(now);

    service.markPostLoginHandled();
    expect(service.shouldIgnoreRouteSave()).toBeTrue();

    (Date.now as any).and.returnValue(
      now + OPConstants.Session.IGNORE_WINDOW_MS + 1,
    );
    expect(service.shouldIgnoreRouteSave()).toBeFalse();
  });
});
