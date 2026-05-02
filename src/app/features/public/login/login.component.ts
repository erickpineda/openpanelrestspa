import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { cilUser, cilLockLocked } from '@coreui/icons';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth/auth.service';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { PostLoginRedirectService } from '@app/core/services/auth/post-login-redirect.service';
import { AuthSyncService } from '@app/core/services/auth/auth-sync.service';
import { OpPrivilegioConstants } from '@app/shared/constants/op-privilegio.constants';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false,
})
export class LoginComponent implements OnInit {
  private readonly privilegiosEntradas = [
    OpPrivilegioConstants.CREAR_ENTRADAS,
    OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
    OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
  ];

  private readonly privilegiosPerfilPropio = [
    OpPrivilegioConstants.GESTIONAR_PERFIL_PROPIO,
    OpPrivilegioConstants.GESTIONAR_PERFIL,
  ];
  private readonly privilegiosModeracionComentarios = [
    OpPrivilegioConstants.APROBAR_COMENTARIOS,
    OpPrivilegioConstants.OCULTAR_COMENTARIOS,
    OpPrivilegioConstants.BORRAR_COMENTARIOS_TODO,
    OpPrivilegioConstants.BORRAR_COMENTARIOS,
    OpPrivilegioConstants.MODERAR_COMENTARIOS,
  ];
  private readonly privilegiosGestion = [
    OpPrivilegioConstants.GESTIONAR_USUARIOS,
    OpPrivilegioConstants.GESTIONAR_ROLES,
    OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS,
    OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS,
  ];
  private readonly privilegiosSistema = [
    OpPrivilegioConstants.GESTIONAR_AJUSTES_SISTEMA,
    OpPrivilegioConstants.GESTIONAR_TEMAS,
    OpPrivilegioConstants.CONFIGURAR_SISTEMA,
  ];
  private readonly privilegiosAccesoPanel = [
    OpPrivilegioConstants.ACCESO_PANEL,
    OpPrivilegioConstants.VER_DASHBOARD,
    ...this.privilegiosEntradas,
    ...this.privilegiosPerfilPropio,
    OpPrivilegioConstants.GESTIONAR_INTERACCIONES_PROPIAS,
    OpPrivilegioConstants.VER_CONTENIDO_PROPIO,
    OpPrivilegioConstants.GESTIONAR_PAGINAS,
    OpPrivilegioConstants.GESTIONAR_ARCHIVOS,
    ...this.privilegiosModeracionComentarios,
    OpPrivilegioConstants.GESTIONAR_CATEGORIAS,
    OpPrivilegioConstants.GESTIONAR_ETIQUETAS,
    ...this.privilegiosGestion,
    ...this.privilegiosSistema,
    OpPrivilegioConstants.REALIZAR_MANTENIMIENTO,
    OpPrivilegioConstants.DEPURAR_ERRORES,
  ];

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

    if (this.hasPrivilege(OpPrivilegioConstants.VER_DASHBOARD)) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    if (this.hasAnyPrivilege(this.privilegiosEntradas)) {
      this.router.navigate(['/admin/control/entradas']);
      return;
    }

    if (this.hasAnyPrivilege(this.privilegiosPerfilPropio)) {
      this.router.navigate(['/admin/control/perfil']);
      return;
    }

    if (this.hasAnyPrivilege(this.privilegiosAccesoPanel)) {
      this.router.navigate(['/admin/control']);
      return;
    }

    this.router.navigate(['/']);
  }

  private hasPrivilege(privilege: string): boolean {
    const user = this.tokenStorage.getUser();
    const privileges: string[] = Array.isArray(user?.privileges) ? user.privileges : [];
    return privileges.includes(privilege);
  }

  private hasAnyPrivilege(privileges: string[]): boolean {
    return privileges.some((privilege) => this.hasPrivilege(privilege));
  }

  reloadPage(): void {
    window.location.reload();
  }
}
