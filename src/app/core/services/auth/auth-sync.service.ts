// auth-sync.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SessionManagerService } from './session-manager.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthSyncService {
  private readonly AUTH_SYNC_KEY = 'auth-sync';

  constructor(
    private tokenStorage: TokenStorageService,
    private sessionManager: SessionManagerService,
    private router: Router
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
        console.log('🔄 Cambio detectado en datos de autenticación');
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
  }

  private handleAuthChange(authData: string): void {
    try {
      const data = JSON.parse(authData);
      
      if (data.type === 'LOGOUT') {
        this.sessionManager.handleLogoutFromSync(data);
      }
    } catch (e) {
      console.error('Error parsing auth sync data:', e);
    }
  }

  // ✅ NUEVO: Método simplificado para inicializar estado
  public initializeAuthState(): void {
    console.log('🔄 AuthSyncService: Inicializando estado de autenticación');
    
    // Sincronizar desde localStorage
    const synced = this.tokenStorage.syncFromLocalStorage();
    
    if (synced) {
      console.log('✅ Estado de autenticación sincronizado correctamente');
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
}