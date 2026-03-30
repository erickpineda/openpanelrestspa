import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { cilUser, cilLockLocked } from '@coreui/icons';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth/auth.service';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { PostLoginRedirectService } from '@app/core/services/auth/post-login-redirect.service';
import { AuthSyncService } from '@app/core/services/auth/auth-sync.service';

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
        this.tryRedirectToLastRoute('manual');
        this.authSync.notifyLogin();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message ?? err.message ?? 'Error en el login';
        this.isLoginFailed = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
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
    // si el usuario es ROLE_ADMIN, mandarlo a admin. Si no, a perfil o home
    const user = this.tokenStorage.getUser();
    if (user && user.roles && user.roles.includes('ROLE_ADMIN')) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/perfil']);
    }
  }
  reloadPage(): void {
    window.location.reload();
  }
}
