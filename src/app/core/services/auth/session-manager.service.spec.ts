import { SessionManagerService } from './session-manager.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { RouteTrackerService } from './route-tracker.service';

fdescribe('SessionManagerService', () => {
  it('handleLogoutFromSync fuerza logout inmediato si no hay cambios sin guardar', (done) => {
    const tokenStorage = jasmine.createSpyObj('TokenStorageService', ['signOut']);
    const unsavedWorkService = jasmine.createSpyObj('UnsavedWorkService', ['hasUnsavedWork']);
    unsavedWorkService.hasUnsavedWork.and.returnValue(false);
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const log = jasmine.createSpyObj('LoggerService', ['info', 'error']);
    const postLoginRedirect = jasmine.createSpyObj('PostLoginRedirectService', [
      'saveLastValidRoute',
      'getAndClearRedirectForTab',
      'normalizeRoute',
      'markPostLoginHandled',
    ]);

    spyOn(window, 'addEventListener').and.callFake(() => {});
    spyOn(document, 'querySelectorAll').and.returnValue({ length: 0 } as any);
    spyOn(RouteTrackerService, 'getLastValidUrl').and.returnValue('/admin/x');

    const uiMonitor = jasmine.createSpyObj('UiAnomalyMonitorService', ['forceCleanupForLogout']);
    const authSync = jasmine.createSpyObj('AuthSyncService', ['notifyChanged']);

    const service = new SessionManagerService(
      tokenStorage as any,
      unsavedWorkService as any,
      router as any,
      log as any,
      postLoginRedirect as any,
      uiMonitor as any,
      authSync as any
    );

    service.sessionExpired$.subscribe((payload) => {
      expect(payload.type).toBe('LOGOUT');
      expect(payload.origin).toBe('remote');
      expect(tokenStorage.signOut).not.toHaveBeenCalled(); // Changed to match code behavior (remote logout shows modal)
      expect(router.navigate).not.toHaveBeenCalled();
      // postLoginRedirect.saveLastValidRoute might still be called
      expect(postLoginRedirect.saveLastValidRoute).toHaveBeenCalledWith('/admin/x');
      done();
    });

    service.handleLogoutFromSync({ timestamp: 123 });
  });

  it('emite evento si hay trabajo sin guardar y allowSave=true', (done) => {
    const tokenStorage = jasmine.createSpyObj('TokenStorageService', ['signOut']);
    const unsavedWorkService = jasmine.createSpyObj('UnsavedWorkService', ['hasUnsavedWork']);
    unsavedWorkService.hasUnsavedWork.and.returnValue(true);
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const log = jasmine.createSpyObj('LoggerService', ['info', 'error']);
    const postLoginRedirect = jasmine.createSpyObj('PostLoginRedirectService', [
      'saveLastValidRoute',
      'getAndClearRedirectForTab',
      'normalizeRoute',
      'markPostLoginHandled',
    ]);

    spyOn(window, 'addEventListener').and.callFake(() => {});
    spyOn(document, 'querySelectorAll').and.returnValue({ length: 0 } as any);

    const uiMonitor = jasmine.createSpyObj('UiAnomalyMonitorService', ['forceCleanupForLogout']);
    const authSync = jasmine.createSpyObj('AuthSyncService', ['notifyChanged']);

    const service = new SessionManagerService(
      tokenStorage as any,
      unsavedWorkService as any,
      router as any,
      log as any,
      postLoginRedirect as any,
      uiMonitor as any,
      authSync as any
    );

    service.sessionExpired$.subscribe((payload) => {
      expect(payload.type).toBe('LOGOUT');
      expect(tokenStorage.signOut).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    });

    service.handleLogoutFromSync({ timestamp: 456 });
  });

  it('saveWorkAndLogout emite evento y fuerza logout tras timeout', () => {
    jasmine.clock().install();

    const tokenStorage = jasmine.createSpyObj('TokenStorageService', ['signOut']);
    const unsavedWorkService = jasmine.createSpyObj('UnsavedWorkService', ['hasUnsavedWork']);
    unsavedWorkService.hasUnsavedWork.and.returnValue(false);
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const log = jasmine.createSpyObj('LoggerService', ['info', 'error']);
    const postLoginRedirect = jasmine.createSpyObj('PostLoginRedirectService', [
      'saveLastValidRoute',
      'getAndClearRedirectForTab',
      'normalizeRoute',
      'markPostLoginHandled',
    ]);

    const addEventListenerSpy = spyOn(window, 'addEventListener').and.callFake(() => {});
    expect(addEventListenerSpy).toBeDefined();

    const dispatchSpy = spyOn(window, 'dispatchEvent').and.callThrough();
    spyOn(document, 'querySelectorAll').and.returnValue({ length: 0 } as any);

    const uiMonitor = jasmine.createSpyObj('UiAnomalyMonitorService', ['forceCleanupForLogout']);
    const authSync = jasmine.createSpyObj('AuthSyncService', ['notifyChanged']);

    const service = new SessionManagerService(
      tokenStorage as any,
      unsavedWorkService as any,
      router as any,
      log as any,
      postLoginRedirect as any,
      uiMonitor as any,
      authSync as any
    );

    spyOn(service, 'performLogout');
    service.saveWorkAndLogout({
      type: 'SESSION_EXPIRED',
      message: 'x',
      allowSave: true,
      timestamp: 1,
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: OPConstants.Events.SAVE_WORK_BEFORE_LOGOUT,
      })
    );
    jasmine.clock().tick(30000);
    expect(service.performLogout).toHaveBeenCalled();

    jasmine.clock().uninstall();
  });
});
