import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class NoAuthGuard implements CanActivate {
  constructor(
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();

    // Si ya está logueado, lo mandamos a la home en lugar de dejarle entrar a login/registro
    if (token && user) {
      return this.router.parseUrl('/home');
    }

    return true;
  }
}
