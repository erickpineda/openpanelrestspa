// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { AuthSyncService } from '../services/auth/auth-sync.service';
import { LoggerService } from '../services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private tokenStorage: TokenStorageService,
    private authSync: AuthSyncService,
    private router: Router,
    private log: LoggerService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // ✅ Sincronizar antes de verificar
    this.authSync.initializeAuthState();

    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();

    this.log.info('🔐 AuthGuard - Token presente:', !!token);
    this.log.info('🔐 AuthGuard - Usuario presente:', !!user);

    if (token && user?.roles) {
      // Verificar roles si es necesario
      const requiredRoles = route.data['roles'] as Array<string>;
      if (requiredRoles) {
        const hasRole = user.roles.some((role: string) => requiredRoles.includes(role));
        if (!hasRole) {
          this.redirectToLogin();
          return false;
        }
      }
      return true;
    }

    this.redirectToLogin();
    return false;
  }

  private redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}