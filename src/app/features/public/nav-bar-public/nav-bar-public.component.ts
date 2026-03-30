import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSyncService } from '@app/core/services/auth/auth-sync.service';
import { AuthService } from '@app/core/services/auth/auth.service';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { LoggerService } from '@app/core/services/logger.service';
import { OPConstants } from '@shared/constants/op-global.constants';
import { LanguageService, Language } from '@app/core/services/language.service';

@Component({
  selector: 'app-nav-bar-public',
  templateUrl: './nav-bar-public.component.html',
  styleUrls: ['./nav-bar-public.component.scss'],
  standalone: false,
})
export class NavBarPublicComponent implements OnInit {
  user: any;
  private roles: string[] = [];
  isLoggedIn = false;
  showAdminBoard = false;
  showModeratorBoard = false;
  username?: string;
  isShrink: boolean = false;
  isLoadingLogout = false;
  currentLang: Language = 'es';
  visible = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isShrink = window.pageYOffset > 100;
  }

  constructor(
    private tokenStorageService: TokenStorageService,
    private authService: AuthService,
    private authSync: AuthSyncService,
    private router: Router,
    private log: LoggerService,
    public languageService: LanguageService
  ) {
    window.addEventListener(OPConstants.Events.AUTH_STATE_CHANGED, () => {
      this.log.info('🔄 NavBar: Estado de autenticación cambiado');
      this.checkAuthStatus();
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.authSync.initializeAuthState();
        this.checkAuthStatus();
      }
    });
  }

  ngOnInit(): void {
    this.checkAuthStatus();
    this.authSync.initializeAuthState();
    this.languageService.currentLang$.subscribe((lang: Language) => {
      this.currentLang = lang;
    });
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  setLanguage(lang: Language): void {
    this.languageService.setLanguage(lang);
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.tokenStorageService.isLoggedIn();
    this.log.info('🔐 NavBar - Estado de autenticación:', this.isLoggedIn);
    if (this.isLoggedIn) {
      this.user = this.tokenStorageService.getUser();
      this.roles = this.user.roles || [];
      this.showAdminBoard = this.roles.includes('ROLE_ADMIN');
      this.showModeratorBoard = this.roles.includes('ROLE_MODERATOR');
      this.username = this.user.username;
    } else {
      this.user = null;
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
        this.checkAuthStatus();
        this.router.navigate(['/']);
      },
      error: () => {
        this.authService.performLogout();
        this.isLoadingLogout = false;
        this.checkAuthStatus();
        this.router.navigate(['/']);
      },
    });
  }
}
