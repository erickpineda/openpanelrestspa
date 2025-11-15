// auth-sync.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SessionManagerService } from './session-manager.service';
import { TokenStorageService } from './token-storage.service';
import { LoggerService } from '../logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthSyncService {
  private readonly AUTH_SYNC_KEY = 'auth-sync';

  private pollIntervalMs = 2000; // cada 2 segundos (ajusta si quieres)
  private pollHandle: any = null;
  private readonly SYNC_TOKEN_KEY = 'sync-auth-token';
  private readonly SYNC_USER_KEY = 'sync-auth-user';
  private readonly TOKEN_KEY = 'auth-token';
  private bc: BroadcastChannel | null = null;

  constructor(
    private tokenStorage: TokenStorageService,
    private sessionManager: SessionManagerService,
    private router: Router,
    private log: LoggerService
  ) {
    this.setupSync();
  }

  private setupSync(): void {
    // Verificar sincronización al iniciar
    this.initializeAuthState();

    window.addEventListener('storage', (event) => {
      if (event.key === this.AUTH_SYNC_KEY && event.newValue) {
        this.handleAuthChange(event.newValue);
      } else if (event.key === 'sync-auth-token' || event.key === 'sync-auth-user') {
        // ✅ NUEVO: Sincronizar cuando cambian los datos de autenticación
        this.log.info('🔄 Cambio detectado en datos de autenticación');
        this.tokenStorage.syncFromLocalStorage();
        
        // Disparar evento para que los componentes se actualicen
        window.dispatchEvent(new Event('authStateChanged'));
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.initializeAuthState();
      }
    });
    this.startPolling();
    // opcional: limpiar el polling al cerrar la pestaña (mejora cortesía)
    window.addEventListener('beforeunload', () => this.stopPolling());
  }

  private handleAuthChange(authData: string): void {
    try {
      const data = JSON.parse(authData);
      
      if (data.type === 'LOGOUT') {
        this.sessionManager.handleLogoutFromSync(data);
      }
    } catch (e) {
      this.log.error('Error parsing auth sync data:', e);
    }
  }

  // ✅ NUEVO: Método simplificado para inicializar estado
  public initializeAuthState(): void {
    this.log.info('🔄 AuthSyncService: Inicializando estado de autenticación');
    
    // Sincronizar desde localStorage
    const synced = this.tokenStorage.syncFromLocalStorage();
    
    if (synced) {
      this.log.info('✅ Estado de autenticación sincronizado correctamente');
      // Disparar evento para que los componentes se actualicen
      window.dispatchEvent(new Event('authStateChanged'));
    }
  }

  public notifyLogin(): void {
    const data = {
      type: 'LOGIN',
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.AUTH_SYNC_KEY, JSON.stringify(data));
    
    setTimeout(() => {
      localStorage.removeItem(this.AUTH_SYNC_KEY);
    }, 20000);
  }

  public notifyLogout(): void {
    const data = {
      type: 'LOGOUT',
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.AUTH_SYNC_KEY, JSON.stringify(data));
    
    setTimeout(() => {
      localStorage.removeItem(this.AUTH_SYNC_KEY);
    }, 30000);
  }

  private startPolling(): void {
    // evita múltiples pollers
    if (this.pollHandle) return;
    this.pollHandle = window.setInterval(() => {
      try {
        const localToken = localStorage.getItem(this.SYNC_TOKEN_KEY);
        const sessionToken = window.sessionStorage.getItem(this.TOKEN_KEY);

        // Caso crítico: sessionStorage tiene token, pero localStorage no --> otra pestaña
        // hizo logout (o borrado). Forzamos logout en esta pestaña.
        if (!localToken && sessionToken) {
          this.log.info('⚠️ AuthSyncService (poll) detectó inconsistencia: token en session pero no en local -> forzando logout');
          // Usamos sessionManager para manejar logout consistente (ya lo usas en handleAuthChange)
          this.sessionManager.handleLogoutFromSync({ type: 'LOGOUT', timestamp: Date.now() });
          // además limpiamos local session para quedar consistente
          this.tokenStorage.signOut();
          // notificamos el cambio de estado para UI
          window.dispatchEvent(new Event('authStateChanged'));
        }

        // Caso inverso: localToken existe pero sessionToken no -> sincronizamos sesión
        if (localToken && !sessionToken) {
          this.log.info('🔄 AuthSyncService (poll) detectó token en local pero no en session -> sincronizando');
          this.tokenStorage.syncFromLocalStorage();
          window.dispatchEvent(new Event('authStateChanged'));
        }

      } catch (e) {
        // evitar que el poller rompa por excepción
        this.log.error('AuthSyncService poll error', e);
      }
    }, this.pollIntervalMs);
  }

  private stopPolling(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  private setupBroadcastChannel(): void {
  try {
    if ('BroadcastChannel' in window) {
      this.bc = new BroadcastChannel('auth-sync-channel');
      this.bc.onmessage = (ev) => {
        const data = ev.data;
        if (!data) return;
        if (data.type === 'LOGOUT') {
          this.log.info('BroadcastChannel: recibida señal LOGOUT -> manejando logout');
          this.sessionManager.handleLogoutFromSync(data);
          this.tokenStorage.signOut();
          window.dispatchEvent(new Event('authStateChanged'));
        } else if (data.type === 'LOGIN') {
          this.log.info('BroadcastChannel: recibida señal LOGIN -> sincronizando token');
          this.tokenStorage.syncFromLocalStorage();
          window.dispatchEvent(new Event('authStateChanged'));
        }
      };
    }
  } catch (e) {
    this.log.error('No se pudo inicializar BroadcastChannel:', e);
  }
}

private broadcastLogoutViaChannel(): void {
  if (this.bc) {
    this.bc.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
  }
}

private broadcastLoginViaChannel(): void {
  if (this.bc) {
    this.bc.postMessage({ type: 'LOGIN', timestamp: Date.now() });
  }
}

}