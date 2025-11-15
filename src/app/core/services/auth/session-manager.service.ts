// session-manager.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { UnsavedWorkService } from '../utils/unsaved-work.service';
import { LoggerService } from '../logger.service';

export interface SessionExpirationData {
  type: 'LOGOUT' | 'SESSION_EXPIRED' | 'ANOTHER_DEVICE';
  message: string;
  allowSave?: boolean;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessionManagerService {
  private readonly SESSION_SYNC_KEY = 'auth-sync';
  private readonly SESSION_TIMESTAMP_KEY = 'auth-sync-timestamp';

  private sessionExpiredSubject = new Subject<SessionExpirationData>();
  private isProcessing = false;

  public sessionExpired$: Observable<SessionExpirationData> = this.sessionExpiredSubject.asObservable();

  // ---------- Propiedades para polling / sincronización robusta ----------
  private readonly SYNC_TOKEN_KEY = 'sync-auth-token'; // coincide con TokenStorageService
  private readonly TOKEN_KEY = 'auth-token';
  private pollIntervalMs = 2000; // 2s por defecto
  private pollHandle: any = null;
  // -----------------------------------------------------------------------

  constructor(
    private tokenStorage: TokenStorageService,
    private unsavedWorkService: UnsavedWorkService,
    private router: Router,
    private log: LoggerService
  ) {
    this.setupSessionSync();
  }

  private setupSessionSync(): void {
    this.log.info('🔄 SessionManagerService: Configurando sincronización');

    // Verificar eventos pendientes al iniciar
    this.checkPendingEvents();

    window.addEventListener('storage', (event: any) => {
      if (event.key === this.SESSION_SYNC_KEY && event.newValue && !this.isProcessing) {
        this.isProcessing = true;
        setTimeout(() => {
          this.handleSessionChange(event.newValue);
          this.isProcessing = false;
        }, 100);
      }
    });

    // Verificar periódicamente eventos pendientes (ya existía)
    setInterval(() => {
      this.checkPendingEvents();
    }, 5000);

    // Iniciar polling para detectar borrados manuales de sessionStorage u otras inconsistencias
    this.startPollForStorageInconsistencies();

    // Limpiar polling al cerrar la pestaña
    window.addEventListener('beforeunload', () => {
      this.stopPollForStorageInconsistencies();
    });

    this.log.info('✅ SessionManagerService: Sincronización configurada');
  }

  private checkPendingEvents(): void {
    const pendingEvent = localStorage.getItem(this.SESSION_SYNC_KEY);
    const eventTimestamp = localStorage.getItem(this.SESSION_TIMESTAMP_KEY);

    if (pendingEvent && eventTimestamp) {
      const timestamp = parseInt(eventTimestamp, 10);
      const now = Date.now();
      const eventAge = now - timestamp;

      // Procesar eventos de menos de 30 segundos
      if (eventAge < 30000 && !this.isProcessing) {
        this.log.info('📥 Evento pendiente encontrado:', pendingEvent);
        this.isProcessing = true;
        setTimeout(() => {
          this.handleSessionChange(pendingEvent);
          this.isProcessing = false;
        }, 100);
      } else if (eventAge >= 30000) {
        this.cleanupSyncData();
      }
    }
  }

  private handleSessionChange(sessionData: string): void {
    this.log.info('🔄 SessionManagerService: Manejando cambio de sesión:', sessionData);

    try {
      const data = JSON.parse(sessionData);
      this.log.info('📊 Datos parseados:', data);

      if (data.type === 'LOGOUT') {
        this.handleLogout(data);
      }
    } catch (e) {
      this.log.error('❌ Error parsing session data:', e);
    }
  }

  private handleLogout(data: any): void {
    this.log.info('🚪 SessionManagerService: Manejando logout...');

    const logoutData: SessionExpirationData = {
      type: 'LOGOUT',
      message: 'Se ha cerrado la sesión desde otro dispositivo',
      allowSave: true,
      timestamp: data.timestamp || Date.now()
    };

    // Verificar trabajo sin guardar
    const hasUnsavedWork = this.unsavedWorkService.hasUnsavedWork();
    this.log.info('📝 Trabajo sin guardar (servicio):', hasUnsavedWork);

    const hasUnsavedWorkBackup = this.checkUnsavedWorkBackup();
    this.log.info('📝 Trabajo sin guardar (respaldo):', hasUnsavedWorkBackup);

    const shouldShowModal = hasUnsavedWork || hasUnsavedWorkBackup;

    if (shouldShowModal && logoutData.allowSave) {
      this.log.info('📢 Emitiendo evento para mostrar modal...');
      this.sessionExpiredSubject.next(logoutData);
    } else {
      this.log.info('🔓 Forzando logout inmediato...');
      this.performLogout(logoutData);
    }
  }

  private checkUnsavedWorkBackup(): boolean {
    const selectors = [
      'form.ng-dirty',
      'form.ng-touched',
      '[data-unsaved="true"]',
      '.unsaved-work-modified',
      'form.unsaved-work-tracked.unsaved-work-modified'
    ];

    let totalElements = 0;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      this.log.info(`🔍 Selector "${selector}": ${elements.length} elementos`);
      totalElements += elements.length;
    });

    this.log.info('📊 Total elementos sin guardar (respaldo):', totalElements);
    return totalElements > 0;
  }

  public notifyLogout(allowSave: boolean = true): void {
    this.log.info('📢 SessionManagerService: Notificando logout a otras pestañas...');

    const data = {
      type: 'LOGOUT',
      allowSave,
      timestamp: Date.now()
    };

    localStorage.setItem(this.SESSION_SYNC_KEY, JSON.stringify(data));
    localStorage.setItem(this.SESSION_TIMESTAMP_KEY, Date.now().toString());

    this.log.info('💾 Datos guardados en localStorage:', data);

    setTimeout(() => {
      this.cleanupSyncData();
    }, 30000);
  }

  private cleanupSyncData(): void {
    localStorage.removeItem(this.SESSION_SYNC_KEY);
    localStorage.removeItem(this.SESSION_TIMESTAMP_KEY);
    this.log.info('🧹 Datos de sync limpiados');
  }

  public performLogout(data: SessionExpirationData): void {
  this.log.info('🚀 SessionManagerService: Ejecutando performLogout...');

  try {
    // Guardar la URL actual para que, tras el login, podamos volver a ella.
    // Usamos localStorage para que otras pestañas también puedan leerla si hace falta.
    // Guardamos sólo la parte relativa (pathname + search + hash)
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem('post-login-redirect', currentUrl);
    this.log.info('📌 post-login-redirect guardado:', currentUrl);
  } catch (e) {
    this.log.error('❌ No se pudo guardar post-login-redirect', e);
  }

  // Limpiar token/session
  this.tokenStorage.signOut();

  // Navegar a la pantalla de sesión caducada (tu componente maneja modal/volver a login)
  this.router.navigate(['/session-expired'], {
    state: { sessionData: data }
  });
}

  public handleLogoutFromSync(data: any): void {
    this.log.info('🔄 SessionManager: Logout desde sync recibido', data);

    const logoutData: SessionExpirationData = {
      type: 'LOGOUT',
      message: 'Se ha cerrado la sesión desde otro dispositivo',
      allowSave: true,
      timestamp: data.timestamp || Date.now()
    };

    this.handleLogout(logoutData);
  }

  public saveWorkAndLogout(data: SessionExpirationData): void {
    const saveEvent = new CustomEvent('saveWorkBeforeLogout', {
      detail: { timeout: 30000 }
    });
    window.dispatchEvent(saveEvent);

    setTimeout(() => {
      this.performLogout(data);
    }, 30000);
  }

  // ---------- Nuevos métodos: polling para inconsistencias entre session/local ----------
  private startPollForStorageInconsistencies(): void {
    // evita crear más de un poller
    if (this.pollHandle) return;

    this.log.info('🕵️‍♂️ SessionManagerService: iniciando poll para inconsistencias entre session/local storage');

    this.pollHandle = window.setInterval(() => {
      try {
        // Solo revisar cuando la pestaña esté visible (ahorra trabajo en background)
        if (document.visibilityState !== 'visible') {
          return;
        }

        const localToken = localStorage.getItem(this.SYNC_TOKEN_KEY);
        const sessionToken = window.sessionStorage.getItem(this.TOKEN_KEY);

        // Caso A: sessionStorage tiene token pero localStorage NO -> otra pestaña hizo logout (o borrado manual de local)
        if (!localToken && sessionToken) {
          this.log.info('⚠️ Poll detected: token en sessionStorage pero NO en localStorage -> forzando logout por inconsistencia');
          const fakeData = JSON.stringify({ type: 'LOGOUT', timestamp: Date.now(), allowSave: true });
          // Reutilizamos el flujo existente para manejar logout sincronizado
          this.handleSessionChange(fakeData);
          return;
        }

        // Caso B: localStorage tiene token pero sessionStorage NO -> sincronizamos sessionStorage
        if (localToken && !sessionToken) {
          this.log.info('🔁 Poll detected: token en localStorage pero NO en sessionStorage -> sincronizando sessionStorage');
          this.tokenStorage.syncFromLocalStorage();
          window.dispatchEvent(new Event('authStateChanged'));
          return;
        }
      } catch (e) {
        this.log.error('❌ Error en poll de SessionManagerService', e);
      }
    }, this.pollIntervalMs);
  }

  private stopPollForStorageInconsistencies(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
      this.log.info('🛑 SessionManagerService: poll detenido');
    }
  }
  // ------------------------------------------------------------------------
}
