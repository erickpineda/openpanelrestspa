// session-manager.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { UnsavedWorkService } from '../utils/unsaved-work.service';
import { LoggerService } from '../logger.service';
import { RouteTrackerService } from './route-tracker.service';
import { PostLoginRedirectService } from './post-login-redirect.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { OPSessionConstants } from '../../../shared/constants/op-session.constants';
import { UiAnomalyMonitorService } from '../ui/ui-anomaly-monitor.service';
import { AuthSyncService } from './auth-sync.service';

export interface SessionExpirationData {
  type: 'LOGOUT' | 'SESSION_EXPIRED' | 'ANOTHER_DEVICE';
  message: string;
  allowSave?: boolean;
  timestamp: number;
  origin?: 'local' | 'remote';
  isManual?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SessionManagerService {
  private sessionExpiredSubject = new Subject<SessionExpirationData>();
  public sessionExpired$: Observable<SessionExpirationData> =
    this.sessionExpiredSubject.asObservable();

  // Observable para notificar restauración de sesión
  private sessionRestoredSubject = new Subject<void>();
  public sessionRestored$: Observable<void> = this.sessionRestoredSubject.asObservable();

  constructor(
    private tokenStorage: TokenStorageService,
    private unsavedWorkService: UnsavedWorkService,
    private router: Router,
    private log: LoggerService,
    private postLoginRedirect: PostLoginRedirectService,
    private uiMonitor: UiAnomalyMonitorService,
    private authSync: AuthSyncService
  ) {
    this.log.info('SessionManagerService: Instancia creada');
    this.setupListeners();
  }

  private setupListeners(): void {
    // Escuchar eventos emitidos por AuthSyncService (storage / bc)
    window.addEventListener(OPConstants.Events.AUTH_LOGOUT as string, (ev: Event) => {
      const evC = ev as CustomEvent;
      this.log.info('SessionManager: auth:logout recibido', evC.detail);

      // IMPORTANTE: Ignorar eventos originados en esta misma pestaña para evitar bucles o tratamiento incorrecto
      const currentTabId = this.tokenStorage.getOrCreateTabId();
      if (evC.detail?.originTabId === currentTabId) {
        this.log.info('SessionManager: Ignorando evento auth:logout propio (local)');
        return;
      }

      // Intentar guardar inmediatamente el post-login redirect PARA ESTA pestaña
      // antes de que cualquier navegación (local o remota) cambie la URL.
      try {
        const lastValid = RouteTrackerService.getLastValidUrl();
        if (lastValid) {
          this.postLoginRedirect.saveLastValidRoute(lastValid);
          this.log.info(
            'SessionManager: post-login-redirect (lastValidUrl) guardado al recibir auth:logout',
            lastValid
          );
        }
      } catch (e) {
        this.log.error('SessionManager: error preparando post-login-redirect en auth:logout', e);
      }

      this.handleLogoutFromSync(evC.detail);
    });

    // También reaccionar a eventos auth:login si quieres (p. ej. para cerrar modal)
    window.addEventListener(OPConstants.Events.AUTH_LOGIN as string, (ev: Event) => {
      const evC = ev as CustomEvent;
      this.log.info('SessionManager: auth:login recibido', evC.detail);

      // Notificar que la sesión se ha restaurado (para cerrar modales en otras pestañas)
      this.sessionRestoredSubject.next();

      try {
        // Solo actuamos si ya hay token en esta pestaña (sincronizado por AuthSyncService/TokenStorage)
        if (!this.tokenStorage.isLoggedIn()) {
          this.log.info(
            'SessionManager: auth:login pero no hay token en esta pestaña -> solo emitimos authStateChanged'
          );
          window.dispatchEvent(new Event(OPConstants.Events.AUTH_STATE_CHANGED));
          return;
        }

        // Si estamos en pantallas de login/session-expired, navegamos al post-login redirect de ESTA pestaña
        const loc = window.location.pathname + window.location.hash;
        const onLoginPages =
          loc.includes(OPConstants.Session.ROUTE_LOGIN) ||
          loc.includes(OPConstants.Session.ROUTE_SESSION_EXPIRED);

        if (onLoginPages) {
          let redirect = this.postLoginRedirect.getAndClearRedirectForTab();
          if (redirect) {
            let target = this.postLoginRedirect.normalizeRoute(redirect);
            this.log.info('SessionManager: Navegando post-login a', target);
            this.router.navigateByUrl(target);
            this.postLoginRedirect.markPostLoginHandled();
            return;
          } else {
            this.log.info('SessionManager: sin post-login redirect - no se fuerza navegación');
            window.dispatchEvent(new Event(OPConstants.Events.AUTH_STATE_CHANGED));
            return;
          }
        } else {
          window.dispatchEvent(new Event(OPConstants.Events.AUTH_STATE_CHANGED));
        }
      } catch (e) {
        this.log.error('SessionManager: error manejando auth:login', e);
        window.dispatchEvent(new Event(OPConstants.Events.AUTH_STATE_CHANGED));
      }
    });
  }

  // Manejo cuando otra pestaña pidió logout
  public handleLogoutFromSync(data: any): void {
    this.log.info('SessionManager: handleLogoutFromSync', data);

    try {
      const lastValid = RouteTrackerService.getLastValidUrl();
      if (lastValid) {
        this.postLoginRedirect.saveLastValidRoute(lastValid);
      }
    } catch {}

    const payload: SessionExpirationData = {
      type: 'LOGOUT',
      origin: 'remote',
      message: 'Se ha cerrado la sesión desde otra pestaña o dispositivo',
      allowSave: true,
      timestamp: data?.timestamp || Date.now(),
      isManual: data?.isManual || false, // Propagamos si fue manual
    };
    this.handleLogout(payload);
  }

  public notifySessionExpired(): void {
    const payload: SessionExpirationData = {
      type: OPSessionConstants.TYPE_SESSION_EXPIRED as 'SESSION_EXPIRED',
      message: 'Su sesión ha caducado por inactividad',
      allowSave: true, // Permitimos intentar guardar (localmente) si es posible
      timestamp: Date.now(),
      isManual: false,
    };
    const loc = window.location.pathname + window.location.hash;
    const isOnAdmin = loc.includes('/admin');
    if (!isOnAdmin) {
      this.performLogout(payload);
      try {
        this.authSync.notifyLogout({
          originTabId: this.tokenStorage.getOrCreateTabId(),
          reason: OPSessionConstants.TYPE_SESSION_EXPIRED,
          isManual: false,
        });
      } catch {}
      return;
    }
    this.sessionExpiredSubject.next(payload);
    try {
      this.authSync.notifyLogout({
        originTabId: this.tokenStorage.getOrCreateTabId(),
        reason: OPSessionConstants.TYPE_SESSION_EXPIRED,
        isManual: false,
      });
    } catch {}
  }

  public logout(): void {
    const payload: SessionExpirationData = {
      type: 'LOGOUT',
      origin: 'local',
      message: 'Sesión cerrada por el usuario',
      allowSave: true,
      timestamp: Date.now(),
      isManual: true,
    };
    try {
      this.authSync.notifyLogout({
        originTabId: this.tokenStorage.getOrCreateTabId(),
        isManual: true,
      });
    } catch {}
    this.handleLogout(payload);
  }

  private handleLogout(payload: SessionExpirationData): void {
    this.log.info('SessionManager: manejando logout', payload);

    const loc = window.location.pathname + window.location.hash;
    const isOnAdmin = loc.includes('/admin');
    if (!isOnAdmin) {
      this.performLogout(payload);
      return;
    }

    const hasUnsaved = this.unsavedWorkService.hasUnsavedWork();
    const hasUnsavedBackup = this.checkUnsavedWorkBackup();

    if (payload.origin === 'remote') {
      if (payload.allowSave) {
        this.sessionExpiredSubject.next(payload);
        return;
      }
    }

    if ((hasUnsaved || hasUnsavedBackup) && payload.allowSave) {
      // Emitimos para que el componente UI muestre modal de "guardar antes de salir"
      this.sessionExpiredSubject.next(payload);
    } else {
      // Forzamos logout inmediatamente
      this.performLogout(payload);
    }
  }

  private checkUnsavedWorkBackup(): boolean {
    // tu lógica de selectors (igual que la tuya, con logs)
    const selectors = [
      'form.ng-dirty',
      // 'form.ng-touched', // Removed to avoid false positives (touched != modified)
      '[data-unsaved="true"]',
      '.unsaved-work-modified',
    ];
    let total = 0;
    selectors.forEach((s) => {
      const n = document.querySelectorAll(s).length;
      this.log.info('check selector', s, n);
      total += n;
    });
    return total > 0;
  }

  public saveWorkAndLogout(data: SessionExpirationData): void {
    // Dejar que los componentes manejen el guardado escuchando el evento 'saveWorkBeforeLogout'
    window.dispatchEvent(
      new CustomEvent(OPConstants.Events.SAVE_WORK_BEFORE_LOGOUT, {
        detail: { timeout: 30000 },
      })
    );

    // Después de timeout forzamos logout
    setTimeout(() => this.performLogout(data), 30000);
  }

  public performLogout(data: SessionExpirationData & { originTabId?: string }): void {
    this.log.info('SessionManagerService: performLogout', data);

    // 1. Limpieza de seguridad de UI (backdrops, modals)
    try {
      this.uiMonitor.forceCleanupForLogout();
    } catch (e) {
      this.log.error('SessionManager: Error limpiando UI artifacts', e);
    }

    try {
      const lastValid = RouteTrackerService.getLastValidUrl();
      if (lastValid) {
        this.postLoginRedirect.saveLastValidRoute(lastValid);
        this.log.info(
          'post-login-redirect (lastValidUrl) guardado en sessionStorage para esta pestaña',
          lastValid
        );
      }
    } catch (e) {
      this.log.error('Error guardando post-login redirect', e);
    }

    // limpiar token/session (NO borra post-login-redirect-{tabId} porque signOut respeta eso)
    this.tokenStorage.signOut();

    // Redirección según tipo y origen
    if (data.type === 'LOGOUT' && data.origin === 'remote') {
      const loc = window.location.pathname + window.location.hash;
      const isOnAdmin = loc.includes('/admin');
      if (!isOnAdmin) {
        this.log.info('SessionManager: Logout remoto en zona pública -> Redirigir a Home');
        this.router.navigate(['/'], { replaceUrl: true });
        return;
      } else {
        this.log.info(
          'SessionManager: Logout remoto (manual o auto) en admin -> Emitir evento para modal'
        );
        this.sessionExpiredSubject.next(data);
        return;
      }
    }

    if (data.type === 'LOGOUT' && data.origin === 'local') {
      this.log.info('SessionManager: Logout local -> Redirigir silenciosamente a Home');
      this.router.navigate(['/'], { replaceUrl: true });
      return;
    }

    // Navegar a login directamente para cumplir redirecciones esperadas por E2E
    this.router.navigate([OPConstants.Session.ROUTE_LOGIN], {
      replaceUrl: true,
    });
  }
}
