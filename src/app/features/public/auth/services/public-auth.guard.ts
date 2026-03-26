import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { AuthService } from '@app/core/services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PublicAuthGuard implements CanActivate {
  private readonly EXPIRY_MARGIN_SECONDS = 30;

  constructor(
    private tokenStorage: TokenStorageService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();

    if (!token || !user) {
      this.tokenStorage.signOut();
      return this.router.parseUrl('/login');
    }

    if (!this.authService.isTokenValid(this.EXPIRY_MARGIN_SECONDS)) {
      this.tokenStorage.signOut();
      return this.router.parseUrl('/login');
    }

    return true;
  }
}
