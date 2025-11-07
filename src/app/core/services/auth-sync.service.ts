import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorageService } from './token-storage.service';
import { SessionManagerService } from './session-manager.service';

@Injectable({
  providedIn: 'root'
})
export class AuthSyncService {
  private readonly AUTH_SYNC_KEY = 'auth-sync';
  private readonly AUTH_TIMESTAMP_KEY = 'auth-sync-timestamp';

  constructor(
    private tokenStorage: TokenStorageService,
    private sessionManager: SessionManagerService,
    private router: Router
  ) {
    this.setupSync();
  }

  private setupSync(): void {
    // Verificar eventos pendientes al iniciar
    this.checkPendingAuthEvents();

    window.addEventListener('storage', (event) => {
      if (event.key === this.AUTH_SYNC_KEY && event.newValue) {
        this.handleAuthChange(event.newValue);
      }
    });

    // Verificar periódicamente
    setInterval(() => {
      this.checkPendingAuthEvents();
    }, 5000);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkPendingAuthEvents();
        this.checkAuthStatus();
      }
    });
  }

  private checkPendingAuthEvents(): void {
    const pendingEvent = localStorage.getItem(this.AUTH_SYNC_KEY);
    const eventTimestamp = localStorage.getItem(this.AUTH_TIMESTAMP_KEY);
    
    if (pendingEvent && eventTimestamp) {
      const timestamp = parseInt(eventTimestamp, 10);
      const now = Date.now();
      const eventAge = now - timestamp;
      
      if (eventAge < 30000) {
        console.log('📥 Evento auth pendiente encontrado:', pendingEvent);
        this.handleAuthChange(pendingEvent);
      } else {
        this.cleanupAuthData();
      }
    }
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

  public checkAuthStatus(): void {
    const token = this.tokenStorage.getToken();
    if (!token) {
      const recentLogout = localStorage.getItem(this.AUTH_SYNC_KEY);
      if (recentLogout) {
        try {
          const data = JSON.parse(recentLogout);
          if (data.type === 'LOGOUT') {
            console.log('🔐 Sesión cerrada recientemente, redirigiendo...');
            this.router.navigate(['/session-expired']);
          }
        } catch (e) {
          console.error('Error parsing recent logout:', e);
        }
      }
    }
  }

  public notifyLogin(): void {
    const data = {
      type: 'LOGIN',
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.AUTH_SYNC_KEY, JSON.stringify(data));
    localStorage.setItem(this.AUTH_TIMESTAMP_KEY, Date.now().toString());
    
    setTimeout(() => {
      this.cleanupAuthData();
    }, 10000);
  }

  public notifyLogout(): void {
    const data = {
      type: 'LOGOUT',
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.AUTH_SYNC_KEY, JSON.stringify(data));
    localStorage.setItem(this.AUTH_TIMESTAMP_KEY, Date.now().toString());
    
    setTimeout(() => {
      this.cleanupAuthData();
    }, 30000);
  }

  private cleanupAuthData(): void {
    localStorage.removeItem(this.AUTH_SYNC_KEY);
    localStorage.removeItem(this.AUTH_TIMESTAMP_KEY);
  }

  private forceLogout(): void {
    this.tokenStorage.signOut();
    
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin')) {
      this.router.navigate(['/login']);
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
}