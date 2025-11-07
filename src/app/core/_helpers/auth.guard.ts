import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthSyncService } from '../services/auth-sync.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private tokenStorage: TokenStorageService,
    private authSync: AuthSyncService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Verificar sincronización inmediatamente
    this.authSync.checkAuthStatus();

    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();

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
