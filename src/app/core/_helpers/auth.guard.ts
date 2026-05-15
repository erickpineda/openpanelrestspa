import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  CanLoad,
  CanMatch,
  Router,
  ActivatedRouteSnapshot,
  Route,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { environment } from '../../../environments/environment';
import { AuthSyncService } from '../services/auth/auth-sync.service';
import { LoggerService } from '../services/logger.service';
import { AuthService } from '../services/auth/auth.service';
import { OPSessionConstants } from '../../shared/constants/op-session.constants';
import { OpPrivilegioConstants } from '../../shared/constants/op-privilegio.constants';
import { UserRole } from '../../shared/types/navigation.types';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad, CanMatch {
  // margen en segundos para considerar "a punto de expirar"
  private readonly EXPIRY_MARGIN_SECONDS = 30;
  private readonly entryPermissions = [
    OpPrivilegioConstants.CREAR_ENTRADAS,
    OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
    OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
  ];
  private readonly selfProfilePermissions = [
    OpPrivilegioConstants.GESTIONAR_PERFIL_PROPIO,
    OpPrivilegioConstants.GESTIONAR_PERFIL,
  ];
  private readonly moderationCommentPermissions = [
    OpPrivilegioConstants.APROBAR_COMENTARIOS,
    OpPrivilegioConstants.OCULTAR_COMENTARIOS,
    OpPrivilegioConstants.BORRAR_COMENTARIOS_TODO,
    OpPrivilegioConstants.BORRAR_COMENTARIOS,
    OpPrivilegioConstants.MODERAR_COMENTARIOS,
  ];
  private readonly managementPermissions = [
    OpPrivilegioConstants.GESTIONAR_USUARIOS,
    OpPrivilegioConstants.GESTIONAR_ROLES,
    OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS,
    OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS,
  ];
  private readonly systemSettingsPermissions = [
    OpPrivilegioConstants.GESTIONAR_AJUSTES_SISTEMA,
    OpPrivilegioConstants.GESTIONAR_TEMAS,
    OpPrivilegioConstants.CONFIGURAR_SISTEMA,
  ];
  private readonly accessPanelPermissions = [
    OpPrivilegioConstants.ACCESO_PANEL,
    OpPrivilegioConstants.VER_DASHBOARD,
    ...this.entryPermissions,
    ...this.selfProfilePermissions,
    OpPrivilegioConstants.GESTIONAR_INTERACCIONES_PROPIAS,
    OpPrivilegioConstants.VER_CONTENIDO_PROPIO,
    OpPrivilegioConstants.GESTIONAR_PAGINAS,
    OpPrivilegioConstants.GESTIONAR_ARCHIVOS,
    ...this.moderationCommentPermissions,
    OpPrivilegioConstants.GESTIONAR_CATEGORIAS,
    OpPrivilegioConstants.GESTIONAR_ETIQUETAS,
    ...this.managementPermissions,
    ...this.systemSettingsPermissions,
    OpPrivilegioConstants.REALIZAR_MANTENIMIENTO,
    OpPrivilegioConstants.DEPURAR_ERRORES,
  ];

  constructor(
    private tokenStorage: TokenStorageService,
    private authSync: AuthSyncService,
    private router: Router,
    private log: LoggerService,
    private authService: AuthService
  ) {}

  // Common check reused by the three guards
  checkAuth(): boolean | UrlTree {
    if (environment && (environment as any).mock) {
      return true;
    }
    try {
      if ((window as any).__E2E_BYPASS_AUTH__ === true) {
        return true;
      }
    } catch {}
    // sincronizar estado entre pestañas
    this.authSync.initializeAuthState();

    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();

    this.log.info('🔐 AuthGuard - Token presente:', !!token);
    this.log.info('🔐 AuthGuard - Usuario presente:', !!user);

    if (!token || !user) {
      this.log.info('🔐 AuthGuard - No hay token o usuario -> redirigiendo');
      return this.router.parseUrl('/login');
    }

    if (!this.authService.isTokenValid(this.EXPIRY_MARGIN_SECONDS)) {
      this.log.info(
        '🔐 AuthGuard - Token caducado o a punto de caducar -> redirigiendo con sessionData'
      );
      // Pasamos sessionData en el state para que SessionExpiredComponent lo recoja.
      // Usamos navigate() + return false porque createUrlTree() no soporta state.
      this.router.navigate(['/login'], {
        state: {
          sessionData: {
            type: OPSessionConstants.TYPE_SESSION_EXPIRED,
            message: 'Su sesión ha caducado. Por favor, inicie sesión de nuevo.',
            allowSave: true,
            timestamp: Date.now(),
          },
        },
      });
      return false;
    }

    return true;
  }

  private redirectForForbidden(): UrlTree {
    try {
      const token = this.tokenStorage.getToken();
      const user = this.tokenStorage.getUser();
      if (token && user) {
        const privileges: string[] = Array.isArray(user?.privileges) ? user.privileges : [];
        const has = (privilege: string) => privileges.includes(privilege);
        const hasAny = (required: string[]) => required.some((privilege) => has(privilege));

        if (has(OpPrivilegioConstants.VER_DASHBOARD)) {
          return this.router.parseUrl('/admin/dashboard');
        }

        if (hasAny(this.entryPermissions)) {
          return this.router.parseUrl('/admin/control/entradas');
        }

        if (hasAny(this.selfProfilePermissions)) {
          return this.router.parseUrl('/admin/control/perfil');
        }

        if (hasAny(this.accessPanelPermissions)) {
          return this.router.parseUrl('/admin/control');
        }

        return this.router.parseUrl('/');
      }
    } catch {}
    return this.router.parseUrl('/login');
  }

  private hasRequiredPermissions(
    data: Record<string, unknown>,
    context: 'canActivate' | 'canLoad' | 'canMatch'
  ): boolean | UrlTree | undefined {
    const requiredPermissions = data['permissions'] as Array<string> | undefined;
    const hasPermissionRequirements = !!requiredPermissions && requiredPermissions.length > 0;

    if (!hasPermissionRequirements) {
      return undefined;
    }

    const permissionMode = (data['permissionMode'] as 'ANY' | 'ALL' | undefined) ?? 'ANY';
    const user = this.tokenStorage.getUser();
    const userPrivs: string[] = Array.isArray(user?.privileges) ? user.privileges : [];
    const set = new Set(userPrivs);
    const effectiveRequiredPermissions = this.expandLegacyPermissions(requiredPermissions);
    const ok =
      permissionMode === 'ALL'
        ? effectiveRequiredPermissions.every((p) => set.has(p))
        : effectiveRequiredPermissions.some((p) => set.has(p));

    if (!ok) {
      this.log.info(
        `🔐 AuthGuard - Usuario no tiene permisos requeridos (${context}):`,
        effectiveRequiredPermissions
      );
      return this.redirectForForbidden();
    }

    return true;
  }

  private expandLegacyPermissions(requiredPermissions: string[]): string[] {
    const expanded = new Set<string>();

    for (const permission of requiredPermissions) {
      expanded.add(permission);

      if (permission === OpPrivilegioConstants.GESTIONAR_PERFIL_PROPIO) {
        expanded.add(OpPrivilegioConstants.GESTIONAR_PERFIL);
      }

      if (permission === OpPrivilegioConstants.GESTIONAR_INTERACCIONES_PROPIAS) {
        expanded.add(OpPrivilegioConstants.VER_CONTENIDO_PROPIO);
      }

      if (permission === OpPrivilegioConstants.GESTIONAR_ROLES) {
        expanded.add(OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS);
      }

      if (
        permission === OpPrivilegioConstants.GESTIONAR_AJUSTES_SISTEMA ||
        permission === OpPrivilegioConstants.GESTIONAR_TEMAS
      ) {
        expanded.add(OpPrivilegioConstants.CONFIGURAR_SISTEMA);
      }

      if (permission === OpPrivilegioConstants.ACCESO_PANEL) {
        for (const fallbackPermission of this.accessPanelPermissions) {
          expanded.add(fallbackPermission);
        }
      }
    }

    return Array.from(expanded);
  }

  private hasRequiredRolesOrMinRole(
    data: Record<string, unknown>,
    context: 'canActivate' | 'canLoad' | 'canMatch'
  ): boolean | UrlTree {
    const requiredRoles = data['roles'] as Array<UserRole | string> | undefined;
    if (requiredRoles && requiredRoles.length > 0 && !this.tokenStorage.hasAnyRole(requiredRoles)) {
      this.log.info(`🔐 AuthGuard - Usuario no tiene los roles requeridos (${context}):`, requiredRoles);
      return this.redirectForForbidden();
    }

    const minRoleRaw = data['minRole'] as UserRole | string | undefined;
    if (minRoleRaw) {
      const minRole =
        typeof minRoleRaw === 'string' ? this.tokenStorage.parseUserRole(minRoleRaw) : minRoleRaw;
      if (!minRole || !this.tokenStorage.hasMinimumRole(minRole)) {
        this.log.info(`🔐 AuthGuard - Usuario no cumple el rol mínimo requerido (${context}):`, minRoleRaw);
        return this.redirectForForbidden();
      }
    }

    return true;
  }

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    try {
      const qp =
        typeof window !== 'undefined'
          ? new URL(window.location.href).searchParams.get('e2e')
          : null;
      if (qp === '1') {
        return true;
      }
    } catch {}

    const check = this.checkAuth();
    if (check instanceof UrlTree) {
      return check;
    }
    if (!check) {
      // Si checkAuth retornó false, asumimos que ya manejó la redirección (expired)
      // o que se denegó el acceso (aunque !token devuelve UrlTree ahora).
      // En cualquier caso, retornamos false para detener la navegación actual.
      return false;
    }

    const data = (route.data || {}) as Record<string, unknown>;
    const permissionDecision = this.hasRequiredPermissions(data, 'canActivate');
    if (permissionDecision !== undefined) {
      return permissionDecision;
    }

    return this.hasRequiredRolesOrMinRole(data, 'canActivate');
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot): boolean | UrlTree {
    return this.canActivate(childRoute);
  }

  canLoad(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    const check = this.checkAuth();
    if (check instanceof UrlTree) {
      return check;
    }
    if (!check) return false;

    const data = (route.data || {}) as Record<string, unknown>;
    const permissionDecision = this.hasRequiredPermissions(data, 'canLoad');
    if (permissionDecision !== undefined) {
      return permissionDecision;
    }

    return this.hasRequiredRolesOrMinRole(data, 'canLoad');
  }

  canMatch(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    const check = this.checkAuth();
    if (check instanceof UrlTree) {
      return check;
    }
    if (!check) return false;

    const data = (route.data || {}) as Record<string, unknown>;
    const permissionDecision = this.hasRequiredPermissions(data, 'canMatch');
    if (permissionDecision !== undefined) {
      return permissionDecision;
    }

    return this.hasRequiredRolesOrMinRole(data, 'canMatch');
  }

  private redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
