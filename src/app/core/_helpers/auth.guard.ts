// auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate, CanActivateChild, CanLoad,
  Router, ActivatedRouteSnapshot, Route, UrlSegment
} from '@angular/router';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { AuthSyncService } from '../services/auth/auth-sync.service';
import { LoggerService } from '../services/logger.service';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {

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
    // sincronizar estado entre pestañas
    this.authSync.initializeAuthState();

    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();

    this.log.info('🔐 AuthGuard - Token presente:', !!token);
    this.log.info('🔐 AuthGuard - Usuario presente:', !!user);

    if (!token || !user) {
      this.log.info('🔐 AuthGuard - No hay token o usuario -> redirigiendo');
      this.router.navigate(['/login']);
      return false;
    }

    if (!this.authService.isTokenValid(this.EXPIRY_MARGIN_SECONDS)) {
      this.log.info('🔐 AuthGuard - Token caducado o a punto de caducar -> forzando logout');
      this.authService.forceLogoutDueToExpiredToken();
      return false;
    }

    return true;
  }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.checkAuth()) {
      return false;
    }

    // comprobación de roles (si la ruta la requiere)
    const requiredRoles = route.data['roles'] as Array<string> | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const user = this.tokenStorage.getUser();
      const hasRole = Array.isArray(user?.roles) && user.roles.some((role: string) => requiredRoles.includes(role));
      if (!hasRole) {
        this.log.info('🔐 AuthGuard - Usuario no tiene los roles requeridos:', requiredRoles);
        this.router.navigate(['/login']);
        return false;
      }
    }

    return true;
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot): boolean {
    // reutiliza la misma lógica que canActivate
    return this.canActivate(childRoute);
  }

  canLoad(route: Route, segments: UrlSegment[]): boolean {
    // canLoad no provee ActivatedRouteSnapshot con data roles,
    // así que solo verificamos autenticación; si necesitas roles hay que
    // manejarlo en la ruta con canActivate o comprobar route.data aquí.
    return this.checkAuth();
  }

  private redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
