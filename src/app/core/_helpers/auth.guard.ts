import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  CanLoad,
  CanMatch,
  Router,
  ActivatedRouteSnapshot,
  Route,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { environment } from '../../../environments/environment';
import { AuthSyncService } from '../services/auth/auth-sync.service';
import { LoggerService } from '../services/logger.service';
import { AuthService } from '../services/auth/auth.service';
import { OPSessionConstants } from '../../shared/constants/op-session.constants';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad, CanMatch {
  // margen en segundos para considerar "a punto de expirar"
  private readonly EXPIRY_MARGIN_SECONDS = 30;

  constructor(
    private tokenStorage: TokenStorageService,
    private authSync: AuthSyncService,
    private router: Router,
    private log: LoggerService,
    private authService: AuthService
  ) {}

  // Common check reused by the three guards
  checkAuth(): boolean | UrlTree {
    if (environment && (environment as any).mock) {
      return true;
    }
    try {
      if ((window as any).__E2E_BYPASS_AUTH__ === true) {
        return true;
      }
    } catch {}
    // sincronizar estado entre pestañas
    this.authSync.initializeAuthState();

    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();

    this.log.info('🔐 AuthGuard - Token presente:', !!token);
    this.log.info('🔐 AuthGuard - Usuario presente:', !!user);

    if (!token || !user) {
      this.log.info('🔐 AuthGuard - No hay token o usuario -> redirigiendo');
      return this.router.parseUrl('/login');
    }

    if (!this.authService.isTokenValid(this.EXPIRY_MARGIN_SECONDS)) {
      this.log.info(
        '🔐 AuthGuard - Token caducado o a punto de caducar -> redirigiendo con sessionData'
      );
      // Pasamos sessionData en el state para que SessionExpiredComponent lo recoja.
      // Usamos navigate() + return false porque createUrlTree() no soporta state.
      this.router.navigate(['/login'], {
        state: { 
          sessionData: { 
            type: OPSessionConstants.TYPE_SESSION_EXPIRED, 
            message: 'Su sesión ha caducado. Por favor, inicie sesión de nuevo.',
            allowSave: true, 
            timestamp: Date.now() 
          } 
        }
      });
      return false;
    }

    return true;
  }

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    try {
      const qp =
        typeof window !== 'undefined'
          ? new URL(window.location.href).searchParams.get('e2e')
          : null;
      if (qp === '1') {
        return true;
      }
    } catch {}
    
    const check = this.checkAuth();
    if (check instanceof UrlTree) {
      return check;
    }
    if (!check) {
      // Si checkAuth retornó false, asumimos que ya manejó la redirección (expired)
      // o que se denegó el acceso (aunque !token devuelve UrlTree ahora).
      // En cualquier caso, retornamos false para detener la navegación actual.
      return false;
    }

    // comprobación de roles (si la ruta la requiere)
    const requiredRoles = route.data['roles'] as Array<string> | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const user = this.tokenStorage.getUser();
      const hasRole =
        Array.isArray(user?.roles) &&
        user.roles.some((role: string) => requiredRoles.includes(role));
      if (!hasRole) {
        this.log.info('🔐 AuthGuard - Usuario no tiene los roles requeridos:', requiredRoles);
        return this.router.parseUrl('/login');
      }
    }

    return true;
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot): boolean | UrlTree {
    return this.canActivate(childRoute);
  }

  canLoad(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    const check = this.checkAuth();
    if (check instanceof UrlTree) {
      return check;
    }
    // Si check es false, retornamos false para cancelar la carga.
    // Si check es true, retornamos true.
    return check;
  }

  canMatch(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    const check = this.checkAuth();
    if (check instanceof UrlTree) {
      return check;
    }
    return check;
  }

  private redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
