import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorageService } from './token-storage.service';
import { SessionManagerService } from './session-manager.service';

@Injectable({
  providedIn: 'root'
})
export class AuthSyncService {
  private readonly AUTH_SYNC_KEY = 'auth-sync';

  constructor(
    private tokenStorage: TokenStorageService,
    private sessionManager: SessionManagerService, // ✅ Inyectar SessionManager
    private router: Router
  ) {
    this.setupSync();
  }

  private setupSync(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth-sync' && event.newValue) {
        this.handleAuthChange(event.newValue);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkAuthStatus();
      }
    });
  }

  private handleAuthChange(authData: string): void {
    try {
      const data = JSON.parse(authData);
      
      if (data.type === 'LOGOUT') {
        // ✅ Usar SessionManager en lugar de forceLogout directo
        this.sessionManager.handleLogoutFromSync(data);
      }
    } catch (e) {
      console.error('Error parsing auth sync data:', e);
    }
  }

  public checkAuthStatus(): void {
    const token = this.tokenStorage.getToken();
    if (!token) {
      this.forceLogout();
    } else {
      // Opcional: Verificar token con backend
      this.validateTokenWithBackend();
    }
  }

  private validateTokenWithBackend(): void {
    // Aquí puedes hacer una llamada rápida al backend para verificar el token
    // Por simplicidad, solo verificamos la existencia del token localmente
  }

  public notifyLogin(): void {
    const data = {
      type: 'LOGIN',
      timestamp: Date.now()
    };
    localStorage.setItem(this.AUTH_SYNC_KEY, JSON.stringify(data));
    
    // Limpiar después de un tiempo
    setTimeout(() => {
      localStorage.removeItem(this.AUTH_SYNC_KEY);
    }, 1000);
  }

  public notifyLogout(): void {
    const data = {
      type: 'LOGOUT',
      timestamp: Date.now()
    };
    localStorage.setItem(this.AUTH_SYNC_KEY, JSON.stringify(data));
    
    // Limpiar después de un tiempo
    setTimeout(() => {
      localStorage.removeItem(this.AUTH_SYNC_KEY);
    }, 1000);
  }

  private forceLogout(): void {
    this.tokenStorage.signOut();
    
    // Redirigir a login si estamos en una ruta protegida
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin')) {
      this.router.navigate(['/login']);
    }
    
    // Forzar recarga si es necesario
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
}
