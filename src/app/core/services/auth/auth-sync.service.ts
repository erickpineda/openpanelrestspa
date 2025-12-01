// src/app/core/services/auth/auth-sync.service.ts
import { Injectable } from '@angular/core';
import { TokenStorageService } from './token-storage.service';
import { LoggerService } from '../logger.service';

type SyncEvent = { type: 'LOGIN' | 'LOGOUT' | 'CHANGED'; timestamp: number; [k: string]: any };

@Injectable({ providedIn: 'root' })
export class AuthSyncService {
  private readonly AUTH_SYNC_KEY = 'auth-sync';
  private readonly CHANNEL_NAME = 'auth-sync-channel';
  private bc: BroadcastChannel | null = null;
  private cleanupTimeoutMs = 30_000;

  constructor(
    private tokenStorage: TokenStorageService,
    private log: LoggerService
  ) {
    this.setup();
  }

  private setup(): void {
    this.log.info('AuthSyncService: inicializando');

    try {
      if ('BroadcastChannel' in window) {
        this.bc = new BroadcastChannel(this.CHANNEL_NAME);
        this.bc.onmessage = (ev) => {
          const data = ev.data as SyncEvent | undefined;
          if (!data) return;
          this.log.info('AuthSyncService: BroadcastChannel received', data);
          this.emitEventFromSync(data);
        };
      }
    } catch (e) {
      this.log.error('AuthSyncService: BroadcastChannel no disponible', e);
    }

    // Escuchar storage events (otros tabs)
    window.addEventListener('storage', (ev: StorageEvent) => {
      if (ev.key === this.AUTH_SYNC_KEY && ev.newValue) {
        try {
          const data = JSON.parse(ev.newValue) as SyncEvent;
          this.log.info('AuthSyncService: storage event recibido', data);
          this.emitEventFromSync(data);
        } catch (e) {
          this.log.error('AuthSyncService: error parseando storage event', e);
        }
      }
    });

    // Cuando la pestaña vuelve a ser visible, sincronizamos (compatibilidad)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.log.info('AuthSyncService: pestaña visible -> sincronizando token local');
        const synced = this.tokenStorage.syncFromLocalStorage();
        if (synced) {
          // Emitimos ambos por compatibilidad y para actualizar UI
          window.dispatchEvent(new Event('authStateChanged'));
          window.dispatchEvent(new CustomEvent('auth:changed', { detail: { source: 'visibility' } }));
        }
      }
    });
  }

  /**
   * Inicializar estado de autenticación al arrancar la app / componente.
   * Compatibilidad: los componentes llaman a este método esperando que sincronice sessionStorage desde localStorage.
   */
  public initializeAuthState(): void {
    this.log.info('AuthSyncService: initializeAuthState() invoked');
    try {
      const synced = this.tokenStorage.syncFromLocalStorage();
      // Emitir evento legado para los componentes que lo esperan
      window.dispatchEvent(new Event('authStateChanged'));
      // También emitir evento moderno para listeners específicos
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { synced } }));
      this.log.info('AuthSyncService: initializeAuthState finished, synced=', synced);
    } catch (e) {
      this.log.error('AuthSyncService: error en initializeAuthState', e);
    }
  }

  // Public API
  public notifyLogin(extra: Record<string, any> = {}): void {
    const payload: SyncEvent = {
      type: 'LOGIN',
      timestamp: Date.now(),
      originTabId: this.tokenStorage.getOrCreateTabId(),
      ...extra
    };
    this.broadcast(payload);
    this.tokenStorage.syncFromLocalStorage();
    window.dispatchEvent(new CustomEvent('auth:login', { detail: payload }));
    window.dispatchEvent(new Event('authStateChanged'));
  }

  public notifyLogout(extra: Record<string, any> = {}): void {
    const payload: SyncEvent = {
      type: 'LOGOUT',
      timestamp: Date.now(),
      originTabId: this.tokenStorage.getOrCreateTabId(),
      ...extra
    };
    this.broadcast(payload);
    window.dispatchEvent(new CustomEvent('auth:logout', { detail: payload }));
    window.dispatchEvent(new Event('authStateChanged'));
  }

  public notifyChanged(extra: Record<string, any> = {}): void {
    const payload: SyncEvent = {
      type: 'CHANGED',
      timestamp: Date.now(),
      originTabId: this.tokenStorage.getOrCreateTabId(),
      ...extra
    };
    this.broadcast(payload);
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: payload }));
    window.dispatchEvent(new Event('authStateChanged'));
  }

  private broadcast(payload: SyncEvent): void {
    try {
      // 1) localStorage -> disparará storage event en otras pestañas
      localStorage.setItem(this.AUTH_SYNC_KEY, JSON.stringify(payload));
      setTimeout(() => {
        try { localStorage.removeItem(this.AUTH_SYNC_KEY); } catch {}
      }, this.cleanupTimeoutMs);

      // 2) BroadcastChannel (si está disponible)
      if (this.bc) {
        try { this.bc.postMessage(payload); } catch (e) { this.log.error('AuthSync: bc.postMessage falló', e); }
      }

      this.log.info('AuthSyncService: broadcast enviado', payload);
    } catch (e) {
      this.log.error('AuthSyncService: error broadcasting', e);
    }
  }

  private emitEventFromSync(data: SyncEvent): void {
    if (!data) return;
    // si viene LOGIN, sincronizamos token local->session y avisamos
    if (data.type === 'LOGIN') {
      this.tokenStorage.syncFromLocalStorage();
      window.dispatchEvent(new CustomEvent('auth:login', { detail: data }));
      window.dispatchEvent(new Event('authStateChanged'));
      return;
    }

    if (data.type === 'LOGOUT') {
      window.dispatchEvent(new CustomEvent('auth:logout', { detail: data }));
      window.dispatchEvent(new Event('authStateChanged'));
      return;
    }

    // CHANGED u otros
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: data }));
    window.dispatchEvent(new Event('authStateChanged'));
  }
}
