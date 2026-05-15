import { ActivatedRouteSnapshot, Route, Router } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { OpPrivilegioConstants } from '../../shared/constants/op-privilegio.constants';
import { UserRole } from '../../shared/types/navigation.types';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: jasmine.SpyObj<Router>;
  let tokenStorage: jasmine.SpyObj<any>;
  let authSync: jasmine.SpyObj<any>;
  let log: jasmine.SpyObj<any>;
  let authService: jasmine.SpyObj<any>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['parseUrl', 'navigate']);
    router.parseUrl.and.callFake((url: string) => url as any);

    tokenStorage = jasmine.createSpyObj('TokenStorageService', [
      'getToken',
      'getUser',
      'hasAnyRole',
      'hasMinimumRole',
      'parseUserRole',
    ]);
    tokenStorage.getToken.and.returnValue('jwt');
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.GESTIONAR_CATEGORIAS],
    });
    tokenStorage.parseUserRole.and.callFake((role: UserRole | string) => role);

    authSync = jasmine.createSpyObj('AuthSyncService', ['initializeAuthState']);
    log = jasmine.createSpyObj('LoggerService', ['info']);
    authService = jasmine.createSpyObj('AuthService', ['isTokenValid']);
    authService.isTokenValid.and.returnValue(true);

    guard = new AuthGuard(tokenStorage, authSync, router, log, authService);
  });

  it('debe priorizar permissions frente a roles en canActivate', () => {
    tokenStorage.hasAnyRole.and.returnValue(false);

    const result = guard.canActivate({
      data: {
        permissions: [OpPrivilegioConstants.GESTIONAR_CATEGORIAS],
        roles: [UserRole.ADMINISTRADOR],
      },
    } as unknown as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
    expect(tokenStorage.hasAnyRole).not.toHaveBeenCalled();
    expect(tokenStorage.hasMinimumRole).not.toHaveBeenCalled();
  });

  it('debe cortar limpio con permissions y no evaluar minRole en canActivate', () => {
    tokenStorage.hasMinimumRole.and.returnValue(false);

    const result = guard.canActivate({
      data: {
        permissions: [OpPrivilegioConstants.GESTIONAR_CATEGORIAS],
        minRole: UserRole.PROPIETARIO,
      },
    } as unknown as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
    expect(tokenStorage.parseUserRole).not.toHaveBeenCalled();
    expect(tokenStorage.hasMinimumRole).not.toHaveBeenCalled();
  });

  it('debe denegar por permissions sin caer a lógica híbrida en canActivate', () => {
    tokenStorage.getUser.and.returnValue({ privileges: [] });

    const result = guard.canActivate({
      data: {
        permissions: [OpPrivilegioConstants.GESTIONAR_CATEGORIAS],
        roles: [UserRole.ADMINISTRADOR],
        minRole: UserRole.PROPIETARIO,
      },
    } as unknown as ActivatedRouteSnapshot);

    expect(result).toBe('/' as any);
    expect(router.parseUrl).toHaveBeenCalledWith('/');
    expect(tokenStorage.hasAnyRole).not.toHaveBeenCalled();
    expect(tokenStorage.hasMinimumRole).not.toHaveBeenCalled();
  });

  it('debe redirigir a entradas si no tiene acceso y sí tiene privilegios de entradas', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.CREAR_ENTRADAS],
    });

    const result = guard.canActivate({
      data: {
        permissions: [OpPrivilegioConstants.GESTIONAR_CATEGORIAS],
      },
    } as unknown as ActivatedRouteSnapshot);

    expect(result).toBe('/admin/control/entradas' as any);
    expect(router.parseUrl).toHaveBeenCalledWith('/admin/control/entradas');
  });

  it('debe aceptar GESTIONAR_PERFIL legacy cuando la ruta pide GESTIONAR_PERFIL_PROPIO', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.GESTIONAR_PERFIL],
    });

    const result = guard.canActivate({
      data: {
        permissions: [OpPrivilegioConstants.GESTIONAR_PERFIL_PROPIO],
      },
    } as unknown as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
  });

  it('debe aceptar VER_CONTENIDO_PROPIO legacy cuando la ruta pide GESTIONAR_INTERACCIONES_PROPIAS', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.VER_CONTENIDO_PROPIO],
    });

    const result = guard.canActivate({
      data: {
        permissions: [OpPrivilegioConstants.GESTIONAR_INTERACCIONES_PROPIAS],
      },
    } as unknown as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
  });

  it('debe aceptar GESTIONAR_ROLES_USUARIOS legacy cuando la ruta pide GESTIONAR_ROLES', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS],
    });

    const result = guard.canActivate({
      data: {
        permissions: [OpPrivilegioConstants.GESTIONAR_ROLES],
      },
    } as unknown as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
  });

  it('debe aceptar CONFIGURAR_SISTEMA legacy cuando la ruta pide GESTIONAR_TEMAS', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.CONFIGURAR_SISTEMA],
    });

    const result = guard.canActivate({
      data: {
        permissions: [OpPrivilegioConstants.GESTIONAR_TEMAS],
      },
    } as unknown as ActivatedRouteSnapshot);

    expect(result).toBeTrue();
  });

  it('debe redirigir al shell admin cuando solo tiene ACCESO_PANEL', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.ACCESO_PANEL],
    });

    const result = guard.canActivate({
      data: {
        permissions: [OpPrivilegioConstants.GESTIONAR_CATEGORIAS],
      },
    } as unknown as ActivatedRouteSnapshot);

    expect(result).toBe('/admin/control' as any);
    expect(router.parseUrl).toHaveBeenCalledWith('/admin/control');
  });

  it('debe redirigir al shell admin cuando solo tiene GESTIONAR_AJUSTES_SISTEMA', () => {
    tokenStorage.getUser.and.returnValue({
      privileges: [OpPrivilegioConstants.GESTIONAR_AJUSTES_SISTEMA],
    });

    const result = guard.canActivate({
      data: {
        permissions: [OpPrivilegioConstants.GESTIONAR_CATEGORIAS],
      },
    } as unknown as ActivatedRouteSnapshot);

    expect(result).toBe('/admin/control' as any);
    expect(router.parseUrl).toHaveBeenCalledWith('/admin/control');
  });

  it('debe aplicar la misma prioridad de permissions en canLoad y canMatch', () => {
    tokenStorage.hasAnyRole.and.returnValue(false);

    const route: Route = {
      path: 'categorias',
      data: {
        permissions: [OpPrivilegioConstants.GESTIONAR_CATEGORIAS],
        roles: [UserRole.ADMINISTRADOR],
      },
    };

    expect(guard.canLoad(route, [])).toBeTrue();
    expect(guard.canMatch(route, [])).toBeTrue();
    expect(tokenStorage.hasAnyRole).not.toHaveBeenCalled();
  });
});
