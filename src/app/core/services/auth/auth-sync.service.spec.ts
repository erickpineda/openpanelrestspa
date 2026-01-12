import { AuthSyncService } from './auth-sync.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

describe('AuthSyncService', () => {
  let tokenStorage: any;
  let log: jasmine.SpyObj<any>;

  beforeEach(() => {
    tokenStorage = jasmine.createSpyObj('TokenStorageService', [
      'getOrCreateTabId',
      'syncFromLocalStorage',
    ]);
    tokenStorage.getOrCreateTabId.and.returnValue('tab');
    tokenStorage.syncFromLocalStorage.and.returnValue(true);
    log = jasmine.createSpyObj('LoggerService', ['info', 'error']);

    spyOn(window, 'addEventListener').and.callFake(() => {});
    spyOn(document, 'addEventListener').and.callFake(() => {});
    localStorage.removeItem(OPConstants.Session.AUTH_SYNC_KEY);
  });

  it('initializeAuthState sincroniza y emite eventos', () => {
    const dispatchSpy = spyOn(window, 'dispatchEvent').and.callThrough();
    const service = new AuthSyncService(tokenStorage, log);
    service.initializeAuthState();

    expect(tokenStorage.syncFromLocalStorage).toHaveBeenCalled();
    const types = dispatchSpy.calls.allArgs().map((a) => (a[0] as Event).type);
    expect(types).toContain(OPConstants.Events.AUTH_STATE_CHANGED);
    expect(types).toContain(OPConstants.Events.AUTH_CHANGED);
  });

  it('notifyLogin escribe sync en localStorage, sincroniza y emite eventos', () => {
    jasmine.clock().install();
    const dispatchSpy = spyOn(window, 'dispatchEvent').and.callThrough();
    const service = new AuthSyncService(tokenStorage, log);

    service.notifyLogin({ x: 1 });

    const raw = localStorage.getItem(OPConstants.Session.AUTH_SYNC_KEY);
    expect(raw).toBeTruthy();
    expect(tokenStorage.syncFromLocalStorage).toHaveBeenCalled();

    const types = dispatchSpy.calls.allArgs().map((a) => (a[0] as Event).type);
    expect(types).toContain(OPConstants.Events.AUTH_LOGIN);
    expect(types).toContain(OPConstants.Events.AUTH_STATE_CHANGED);

    jasmine.clock().tick(30001);
    expect(localStorage.getItem(OPConstants.Session.AUTH_SYNC_KEY)).toBeNull();
    jasmine.clock().uninstall();
  });

  it('notifyLogout emite AUTH_LOGOUT y AUTH_STATE_CHANGED', () => {
    const dispatchSpy = spyOn(window, 'dispatchEvent').and.callThrough();
    const service = new AuthSyncService(tokenStorage, log);

    service.notifyLogout({ y: 2 });

    const types = dispatchSpy.calls.allArgs().map((a) => (a[0] as Event).type);
    expect(types).toContain(OPConstants.Events.AUTH_LOGOUT);
    expect(types).toContain(OPConstants.Events.AUTH_STATE_CHANGED);
  });
});
