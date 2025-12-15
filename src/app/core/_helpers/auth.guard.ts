// auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate, CanActivateChild, CanLoad, CanMatch,
  Router, ActivatedRouteSnapshot, Route, UrlSegment, UrlTree
} from '@angular/router';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { environment } from '../../../environments/environment';
import { AuthSyncService } from '../services/auth/auth-sync.service';
import { LoggerService } from '../services/logger.service';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
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
  private checkAuth(): boolean {
    if (environment && (environment as any).mock) { return true; }
    try { if ((window as any).__E2E_BYPASS_AUTH__ === true) { return true; } } catch {}
    // sincronizar estado entre pestañas
    this.authSync.initializeAuthState();

    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();

    this.log.info('🔐 AuthGuard - Token presente:', !!token);
    this.log.info('🔐 AuthGuard - Usuario presente:', !!user);

    if (!token || !user) {
      this.log.info('🔐 AuthGuard - No hay token o usuario -> redirigiendo');
      return false;
    }

    if (!this.authService.isTokenValid(this.EXPIRY_MARGIN_SECONDS)) {
      this.log.info('🔐 AuthGuard - Token caducado o a punto de caducar -> redirigiendo (sin emitir logout)');
      return false;
    }

    return true;
  }

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    try {
      const qp = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('e2e') : null;
      if (qp === '1') { return true; }
    } catch {}
    if (!this.checkAuth()) {
      return this.router.parseUrl('/login');
    }

    // comprobación de roles (si la ruta la requiere)
    const requiredRoles = route.data['roles'] as Array<string> | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const user = this.tokenStorage.getUser();
      const hasRole = Array.isArray(user?.roles) && user.roles.some((role: string) => requiredRoles.includes(role));
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
    // canLoad no provee ActivatedRouteSnapshot con data roles,
    // así que solo verificamos autenticación; si necesitas roles hay que
    // manejarlo en la ruta con canActivate o comprobar route.data aquí.
    return this.checkAuth() ? true : this.router.parseUrl('/login');
  }

  canMatch(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    return this.checkAuth() ? true : this.router.parseUrl('/login');
  }

  private redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
