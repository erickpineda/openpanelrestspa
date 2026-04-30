import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

import { NavBarPublicComponent } from './nav-bar-public.component';
import { OpPrivilegioConstants } from '@app/shared/constants/op-privilegio.constants';

describe('NavBarPublicComponent', () => {
  let component: NavBarPublicComponent;
  let tokenStorage: jasmine.SpyObj<any>;

  beforeEach(() => {
    tokenStorage = jasmine.createSpyObj('TokenStorageService', ['isLoggedIn', 'getUser']);
    tokenStorage.isLoggedIn.and.returnValue(true);
    tokenStorage.getUser.and.returnValue({
      username: 'demo',
      roles: ['ADMINISTRADOR'],
      privileges: [],
    });

    component = new NavBarPublicComponent(
      tokenStorage,
      jasmine.createSpyObj('AuthService', ['logout', 'performLogout']),
      jasmine.createSpyObj('AuthSyncService', ['initializeAuthState']),
      jasmine.createSpyObj<Router>('Router', ['navigate']),
      jasmine.createSpyObj('LoggerService', ['info']),
      {
        currentLang$: new BehaviorSubject<'es' | 'en'>('es'),
        toggleLanguage: () => {},
        setLanguage: () => {},
      } as any
    );
  });

  it('muestra el acceso admin solo con VER_DASHBOARD', () => {
    tokenStorage.getUser.and.returnValue({
      username: 'admin',
      roles: ['ADMINISTRADOR'],
      privileges: [OpPrivilegioConstants.VER_DASHBOARD],
    });

    (component as any).checkAuthStatus();

    expect(component.showAdminBoard).toBeTrue();
    expect(component.showModeratorBoard).toBeFalse();
  });

  it('muestra moderación solo con MODERAR_COMENTARIOS', () => {
    tokenStorage.getUser.and.returnValue({
      username: 'moderador',
      roles: ['LECTOR'],
      privileges: [OpPrivilegioConstants.MODERAR_COMENTARIOS],
    });

    (component as any).checkAuthStatus();

    expect(component.showAdminBoard).toBeFalse();
    expect(component.showModeratorBoard).toBeTrue();
  });

  it('oculta ambos tableros sin privilegios aunque existan roles altos', () => {
    tokenStorage.getUser.and.returnValue({
      username: 'sin-privilegios',
      roles: ['PROPIETARIO'],
      privileges: [],
    });

    (component as any).checkAuthStatus();

    expect(component.showAdminBoard).toBeFalse();
    expect(component.showModeratorBoard).toBeFalse();
  });
});
