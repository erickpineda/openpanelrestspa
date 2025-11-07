import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { TokenStorageService } from './token-storage.service';

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
  private readonly SESSION_SYNC_KEY = 'session-sync';
  private sessionExpiredSubject = new Subject<SessionExpirationData>();
  
  public sessionExpired$: Observable<SessionExpirationData> = this.sessionExpiredSubject.asObservable();

  constructor(
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {
    this.setupSessionSync();
  }

  private setupSessionSync(): void {
    // Escuchar eventos de almacenamiento entre pestañas
    window.addEventListener('storage', (event) => {
      if (event.key === this.SESSION_SYNC_KEY && event.newValue) {
        this.handleSessionChange(event.newValue);
      }
    });

    // Escuchar eventos de visibilidad
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.validateSession();
      }
    });

    // Validar sesión periódicamente (cada 30 segundos)
    setInterval(() => {
      this.validateSession();
    }, 30000);
  }

  private handleSessionChange(sessionData: string): void {
    try {
      const data: SessionExpirationData = JSON.parse(sessionData);
      
      if (data.type === 'LOGOUT') {
        this.handleLogout(data);
      } else if (data.type === 'SESSION_EXPIRED') {
        this.handleSessionExpired(data);
      }
    } catch (e) {
      console.error('Error parsing session data:', e);
    }
  }

  private handleLogout(data: SessionExpirationData): void {
    // Verificar si tenemos trabajo sin guardar
    const hasUnsavedWork = this.checkUnsavedWork();
    
    if (hasUnsavedWork && data.allowSave) {
      // Mostrar advertencia y permitir guardar
      this.sessionExpiredSubject.next({
        ...data,
        allowSave: true
      });
    } else {
      // Forzar logout inmediato
      this.performLogout(data);
    }
  }

  private handleSessionExpired(data: SessionExpirationData): void {
    this.sessionExpiredSubject.next(data);
  }

  private validateSession(): void {
    const token = this.tokenStorage.getToken();
    if (!token) {
      this.handleSessionExpired({
        type: 'SESSION_EXPIRED',
        message: 'Su sesión ha caducado',
        timestamp: Date.now()
      });
    }
  }

  private checkUnsavedWork(): boolean {
    // Verificar si hay formularios sucios
    const dirtyForms = document.querySelectorAll('form.ng-dirty, form.ng-touched');
    
    // Verificar si hay contenido sin guardar en textareas/inputs
    const unsavedInputs = document.querySelectorAll('input[data-unsaved], textarea[data-unsaved]');
    
    // Verificar en el estado de la aplicación
    const appState = (window as any).__UNSAVED_WORK__;
    
    return dirtyForms.length > 0 || unsavedInputs.length > 0 || appState;
  }

  public notifyLogout(allowSave: boolean = true): void {
    const data: SessionExpirationData = {
      type: 'LOGOUT',
      message: 'Se ha cerrado la sesión desde otro dispositivo',
      allowSave,
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.SESSION_SYNC_KEY, JSON.stringify(data));
    
    setTimeout(() => {
      localStorage.removeItem(this.SESSION_SYNC_KEY);
    }, 1000);
  }

  public notifySessionExpired(): void {
    const data: SessionExpirationData = {
      type: 'SESSION_EXPIRED',
      message: 'Su sesión ha caducado por inactividad',
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.SESSION_SYNC_KEY, JSON.stringify(data));
    
    setTimeout(() => {
      localStorage.removeItem(this.SESSION_SYNC_KEY);
    }, 1000);
  }

  public performLogout(data: SessionExpirationData): void {
    this.tokenStorage.signOut();
    
    // Navegar a la página de sesión expirada
    this.router.navigate(['/session-expired'], { 
      state: { sessionData: data }
    });
  }

  public saveWorkAndLogout(data: SessionExpirationData): void {
    // Emitir evento para que los componentes guarden su trabajo
    const saveEvent = new CustomEvent('saveWorkBeforeLogout', {
      detail: { timeout: 30000 } // 30 segundos para guardar
    });
    window.dispatchEvent(saveEvent);
    
    // Esperar un tiempo para que se guarde el trabajo, luego hacer logout
    setTimeout(() => {
      this.performLogout(data);
    }, 30000);
  }
}