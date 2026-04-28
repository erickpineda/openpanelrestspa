import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { cilUser, cilLockLocked } from '@coreui/icons';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth/auth.service';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { PostLoginRedirectService } from '@app/core/services/auth/post-login-redirect.service';
import { AuthSyncService } from '@app/core/services/auth/auth-sync.service';
import { UserRole } from '@app/shared/types/navigation.types';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false,
})
export class LoginComponent implements OnInit {
  icons = { cilUser, cilLockLocked };
  form: any = { username: null, password: null };
  isLoggedIn = false;
  isLoginFailed = false;
  isLoading = false;
  errorMessage = '';
  errorMessageKey: string | null = null;
  roles: string[] = [];
  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private authSync: AuthSyncService,
    private cdr: ChangeDetectorRef,
    private postLoginRedirect: PostLoginRedirectService
  ) {}
  ngOnInit(): void {
    this.authSync.initializeAuthState();
    if (this.tokenStorage.getToken()) {
      const user = this.tokenStorage.getUser();
      if (!user || !this.authService.isTokenValid()) {
        this.tokenStorage.signOut();
        return;
      }
      this.tryRedirectToLastRoute('ngOnInit');
    }
  }
  onSubmit(): void {
    const { username, password } = this.form;
    if (!username || !password) return;
    this.isLoading = true;
    this.authService.login(username, password).subscribe({
      next: () => {
        this.isLoginFailed = false;
        this.isLoggedIn = true;
        this.roles = this.tokenStorage.getUser().roles;
        this.isLoading = false;
        this.errorMessage = '';
        this.errorMessageKey = null;
        this.tryRedirectToLastRoute('manual');
        this.authSync.notifyLogin();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoginFailed = true;
        this.isLoading = false;
        this.setLoginErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  private setLoginErrorMessage(err: any): void {
    const status = typeof err?.status === 'number' ? err.status : null;

    if (status === 401 || status === 403) {
      this.errorMessageKey = 'PUBLIC.LOGIN.INVALID_CREDENTIALS';
      this.errorMessage = '';
      return;
    }

    if (status === 0) {
      this.errorMessageKey = 'PUBLIC.LOGIN.NETWORK_ERROR';
      this.errorMessage = '';
      return;
    }

    const msg = err?.error?.message;
    if (typeof msg === 'string' && msg.trim().length > 0) {
      this.errorMessageKey = null;
      this.errorMessage = msg.trim();
      return;
    }

    this.errorMessageKey = 'PUBLIC.LOGIN.UNKNOWN_ERROR';
    this.errorMessage = '';
  }
  private tryRedirectToLastRoute(context: string): void {
    try {
      let redirect = this.postLoginRedirect.getAndClearRedirectForTab();
      if (redirect) {
        let target = this.postLoginRedirect.normalizeRoute(redirect);
        try {
          const tree = this.router.parseUrl(target);
          this.router.navigateByUrl(tree);
          this.postLoginRedirect.markPostLoginHandled();
          setTimeout(() => {
            try {
              const current = window.location.pathname + window.location.hash;
              if (!(current.indexOf('#' + target) >= 0 || current.endsWith(target))) {
                try {
                  window.location.hash = target;
                } catch {}
              }
            } catch {}
          }, 150);
        } catch {
          this.router.navigateByUrl(target);
          this.postLoginRedirect.markPostLoginHandled();
        }
        return;
      }
    } catch {}
    if (this.tokenStorage.hasMinimumRole(UserRole.ADMINISTRADOR)) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/admin/control/perfil']);
    }
  }
  reloadPage(): void {
    window.location.reload();
  }
}
