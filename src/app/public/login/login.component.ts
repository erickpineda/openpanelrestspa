// src/app/public/login/login.component.ts
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { cilUser, cilLockLocked } from '@coreui/icons';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { TokenStorageService } from '../../core/services/auth/token-storage.service';
import { PostLoginRedirectService } from '../../core/services/auth/post-login-redirect.service';
import { AuthSyncService } from '../../core/services/auth/auth-sync.service';

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
  isLoading = false; // Nueva variable de estado de carga
  errorMessage = '';
  roles: string[] = [];

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router, // ✅ Usar Router en lugar del servicio custom
    private authSync: AuthSyncService,
    private cdr: ChangeDetectorRef,
    private postLoginRedirect: PostLoginRedirectService
  ) {}

  ngOnInit(): void {
    // Sincronizar estado al iniciar
    this.authSync.initializeAuthState();

    if (this.tokenStorage.getToken()) {
      this.tryRedirectToLastRoute('ngOnInit');
    }
  }

  onSubmit(): void {
    const { username, password } = this.form;

    // Evitar envíos vacíos (pueden ocurrir por conflictos con autofill o doble submit)
    if (!username || !password) {
      return;
    }

    this.isLoading = true;

    this.authService.login(username, password).subscribe({
      next: (data) => {
        this.tokenStorage.saveToken(data.jwttoken);
        this.tokenStorage.saveUser(data);
        this.isLoginFailed = false;
        this.isLoggedIn = true;
        this.roles = this.tokenStorage.getUser().roles;
        this.isLoading = false;

        // Intentar redirigir localmente primero (evita que handlers globales borren la clave antes de leerla)
        this.tryRedirectToLastRoute('manual');

        // Notificar a otras pestañas del login
        this.authSync.notifyLogin();
        this.cdr.detectChanges();
      },
      error: (err) => {
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
                } catch (e) {
                  /* ignore */
                }
              }
            } catch (e) {
              /* ignore */
            }
          }, 150);
        } catch (e) {
          this.router.navigateByUrl(target);
          this.postLoginRedirect.markPostLoginHandled();
        }
        return;
      }
    } catch (e) {
      /* ignore */
    }
    this.router.navigate(['/admin']);
  }

  reloadPage(): void {
    window.location.reload();
  }
}
