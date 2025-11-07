import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TokenStorageService } from '../../core/services/token-storage.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthSyncService } from '../../core/services/auth-sync.service';

@Component({
  selector: 'app-nav-bar-public',
  templateUrl: './nav-bar-public.component.html',
  styleUrls: ['./nav-bar-public.component.scss']
})
export class NavBarPublicComponent implements OnInit {

  private roles: string[] = [];
  isLoggedIn = false;
  showAdminBoard = false;
  showModeratorBoard = false;
  username?: string;
  isShrink: boolean = false;
  isLoadingLogout = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isShrink = window.pageYOffset > 100;
  }

  constructor(
    private tokenStorageService: TokenStorageService,
    private authService: AuthService,
    private authSync: AuthSyncService, // ✅ Inyectar servicio de sync
    private router: Router
  ) {
    // Verificar estado de autenticación cuando la página se vuelve visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkAuthStatus();
      }
    });
  }

  ngOnInit(): void {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.tokenStorageService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.tokenStorageService.getUser();
      this.roles = user.roles;
      this.showAdminBoard = this.roles.includes('ROLE_ADMIN');
      this.showModeratorBoard = this.roles.includes('ROLE_MODERATOR');
      this.username = user.username;
    } else {
      this.roles = [];
      this.showAdminBoard = false;
      this.showModeratorBoard = false;
      this.username = undefined;
    }
  }

  navigateToRoute(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    if (this.isLoadingLogout) return;
    
    this.isLoadingLogout = true;
    
    this.authService.logout().subscribe({
      next: () => {
        this.isLoadingLogout = false;
        this.checkAuthStatus(); // ✅ Actualizar estado local
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Error en logout:', err);
        // Forzar logout local incluso si el backend falla
        this.authService.performLogout();
        this.isLoadingLogout = false;
        this.checkAuthStatus(); // ✅ Actualizar estado local
        this.router.navigate(['/']);
      }
    });
  }
}
