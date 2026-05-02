import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { LoginComponent } from './login.component';
import { OpPrivilegioConstants } from '@app/shared/constants/op-privilegio.constants';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let tokenStorage: jasmine.SpyObj<any>;
  let router: jasmine.SpyObj<Router>;
  let postLoginRedirect: jasmine.SpyObj<any>;

  beforeEach(() => {
    tokenStorage = jasmine.createSpyObj('TokenStorageService', ['getUser']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl', 'parseUrl']);
    postLoginRedirect = jasmine.createSpyObj('PostLoginRedirectService', [
      'getAndClearRedirectForTab',
      'normalizeRoute',
      'markPostLoginHandled',
    ]);

    postLoginRedirect.getAndClearRedirectForTab.and.returnValue(null);
    router.parseUrl.and.callFake((url: string) => url as any);
    tokenStorage.getUser.and.returnValue({ privileges: [] });

    component = new LoginComponent(
      jasmine.createSpyObj('AuthService', ['login', 'isTokenValid']),
      tokenStorage,
      router,
      jasmine.createSpyObj('AuthSyncService', ['initializeAuthState', 'notifyLogin']),
      jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']),
      postLoginRedirect
    );
  });

  it('redirige al dashboard cuando el usuario tiene VER_DASHBOARD', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [
        OpPrivilegioConstants.VER_DASHBOARD,
        OpPrivilegioConstants.CREAR_ENTRADAS,
        OpPrivilegioConstants.GESTIONAR_PERFIL_PROPIO,
      ],
    });

    (component as any).tryRedirectToLastRoute('manual');

    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('redirige a entradas cuando no hay dashboard pero sí privilegios de entradas', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS],
    });

    (component as any).tryRedirectToLastRoute('manual');

    expect(router.navigate).toHaveBeenCalledWith(['/admin/control/entradas']);
  });

  it('redirige al perfil cuando no hay dashboard ni entradas pero sí GESTIONAR_PERFIL_PROPIO', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.GESTIONAR_PERFIL_PROPIO],
    });

    (component as any).tryRedirectToLastRoute('manual');

    expect(router.navigate).toHaveBeenCalledWith(['/admin/control/perfil']);
  });

  it('redirige a home cuando no existe ningún privilegio de fallback', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [],
    });

    (component as any).tryRedirectToLastRoute('manual');

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('redirige al panel de control cuando solo tiene ACCESO_PANEL', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.ACCESO_PANEL],
    });

    (component as any).tryRedirectToLastRoute('manual');

    expect(router.navigate).toHaveBeenCalledWith(['/admin/control']);
  });

  it('redirige al panel de control cuando tiene un privilegio legacy de gestión sin ACCESO_PANEL', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.GESTIONAR_USUARIOS],
    });

    (component as any).tryRedirectToLastRoute('manual');

    expect(router.navigate).toHaveBeenCalledWith(['/admin/control']);
  });
});
