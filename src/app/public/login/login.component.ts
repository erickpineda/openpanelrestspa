// src/app/public/login/login.component.ts
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { cilUser, cilLockLocked } from '@coreui/icons';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { TokenStorageService } from '../../core/services/auth/token-storage.service';
import { CommonFunctionalityService } from '../../shared/services/common-functionality.service';
import { AuthSyncService } from '../../core/services/auth/auth-sync.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Sincronizar estado al iniciar
    this.authSync.initializeAuthState();

    if (this.tokenStorage.getToken()) {
      this.tryRedirectToLastRoute('ngOnInit');
    }
  }

  onSubmit(): void {
    this.isLoading = true;
    const { username, password } = this.form;

    this.authService.login(username, password).subscribe({
      next: data => {
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
      }
    });
  }

  private tryRedirectToLastRoute(context: string): void {
    try {
      const tabKey = this.tokenStorage.getPostLoginKeyForThisTab();
      let redirect: string | null = null;
      try {
        redirect = window.sessionStorage.getItem(tabKey);
      } catch (e) {}
      if (!redirect) {
        // Primero comprobar si existe una clave per-tab en localStorage
        try {
          redirect = localStorage.getItem(tabKey) ?? null;
        } catch (e) {
          redirect = null;
        }
      }

      if (!redirect) {
        redirect = localStorage.getItem('post-login-redirect');
      }

      // Fallback adicional: si no hay redirect para esta pestaña, buscar cualquier clave
      // `post-login-redirect-...` en sessionStorage (por si cambió tabId o se guardó en otra clave)
      if (!redirect) {
        try {
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const k = window.sessionStorage.key(i);
            if (!k) continue;
            if (k.indexOf('post-login-redirect-') === 0) {
              const v = window.sessionStorage.getItem(k);
              if (v) {
                redirect = v;
                break;
              }
            }
          }
        } catch (e) {
        }
      }
      if (redirect) {
        try { window.sessionStorage.removeItem(tabKey); } catch {}
        try { localStorage.removeItem('post-login-redirect'); } catch {}
        let target = redirect;
        if (/^https?:\/\//.test(redirect)) {
          try {
            const u = new URL(redirect, window.location.origin);
            target = u.pathname + u.search + u.hash;
          } catch (e) {}
        }

        // Si la ruta guardada incluye el prefijo '/#', eliminarlo para que
        // Angular Router con useHash:true reciba la ruta correcta.
        if (target.startsWith('/#')) {
          target = target.replace(/^\/#/, '');
        }

        if (!target.startsWith('/')) {
          target = '/' + target;
        }
        try {
          const tree = this.router.parseUrl(target);
          this.router.navigateByUrl(tree);
          // Marcar que hemos manejado el post-login en esta pestaña para evitar
          // que RouteTracker sobrescriba inmediatamente la ruta restaurada.
          try {
            const handledKey = 'post-login-handled-' + tabKey;
            window.sessionStorage.setItem(handledKey, Date.now().toString());
          } catch (e) { /* ignore */ }
          // Después de navegar con Router, comprobamos si la URL efectiva coincide;
          // si no, forzamos el hash del navegador como fallback para HashLocationStrategy.
          setTimeout(() => {
            try {
              const current = window.location.pathname + window.location.hash;
              // normalizar: si current contiene '#'+target o termina con target
              if (!(current.indexOf('#' + target) >= 0 || current.endsWith(target))) {
                try { window.location.hash = target; } catch (e) { /* ignore */ }
              }
            } catch (e) {
              // ignore
            }
          }, 150);
        } catch (e) {
          // fallback string navigation
          this.router.navigateByUrl(target);
          try {
            const handledKey = 'post-login-handled-' + tabKey;
            window.sessionStorage.setItem(handledKey, Date.now().toString());
          } catch (e) { /* ignore */ }
        }
        return;
      }
    } catch (e) {
      // ignore
    }
    // Si no hay redirect guardado, ir a la home pública (no forzar /admin)
    this.router.navigate(['/']);
  }

  reloadPage(): void {
    window.location.reload();
  }
}
