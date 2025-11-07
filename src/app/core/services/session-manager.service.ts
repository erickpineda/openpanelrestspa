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
  private readonly SESSION_SYNC_KEY = 'auth-sync'; // ❌ Era 'session-sync'
  private sessionExpiredSubject = new Subject<SessionExpirationData>();
  
  public sessionExpired$: Observable<SessionExpirationData> = this.sessionExpiredSubject.asObservable();

  constructor(
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {
    this.setupSessionSync();
  }

  private setupSessionSync(): void {
    console.log('🔄 SessionManagerService: Configurando sincronización');
    
    window.addEventListener('storage', (event) => {
      console.log('📡 Evento storage recibido:', event.key, event.newValue);
      if (event.key === this.SESSION_SYNC_KEY && event.newValue) {
        this.handleSessionChange(event.newValue);
      }
    });

    document.addEventListener('visibilitychange', () => {
      console.log('👀 Cambio de visibilidad:', document.hidden);
      if (!document.hidden) {
        this.validateSession();
      }
    });

    console.log('✅ SessionManagerService: Sincronización configurada');
  }

  private handleSessionChange(sessionData: string): void {
    console.log('🔄 SessionManagerService: Manejando cambio de sesión:', sessionData);
    try {
      const data: SessionExpirationData = JSON.parse(sessionData);
      console.log('📊 Datos parseados:', data);
      
      if (data.type === 'LOGOUT') {
        this.handleLogout(data);
      } else if (data.type === 'SESSION_EXPIRED') {
        this.handleSessionExpired(data);
      }
    } catch (e) {
      console.error('❌ Error parsing session data:', e);
    }
  }

  private handleLogout(data: SessionExpirationData): void {
    console.log('🚪 Manejando logout, verificando trabajo sin guardar...');
    const hasUnsavedWork = this.checkUnsavedWork();
    console.log('📝 Trabajo sin guardar detectado:', hasUnsavedWork);
    
    if (hasUnsavedWork && data.allowSave) {
      console.log('📢 Emitiendo evento para mostrar modal...');
      this.sessionExpiredSubject.next({
        ...data,
        allowSave: true
      });
    } else {
      console.log('🔓 Forzando logout inmediato...');
      this.performLogout(data);
    }
  }

  public handleLogoutFromSync(data: any): void {
    console.log('🔄 SessionManager: Logout desde sync recibido', data);
    
    const logoutData: SessionExpirationData = {
      type: 'LOGOUT',
      message: 'Se ha cerrado la sesión desde otro dispositivo',
      allowSave: true, // ✅ Siempre permitir guardar en sync
      timestamp: Date.now()
    };
    
    this.handleLogout(logoutData);
  }

  private checkUnsavedWork(): boolean {
    // Método más robusto para detectar trabajo sin guardar
    const dirtyForms = document.querySelectorAll('form.ng-dirty');
    const touchedForms = document.querySelectorAll('form.ng-touched');
    const unsavedInputs = document.querySelectorAll('[data-unsaved="true"]');
    
    console.log('🔍 Buscando trabajo sin guardar:');
    console.log('   - Formularios dirty:', dirtyForms.length);
    console.log('   - Formularios touched:', touchedForms.length);
    console.log('   - Inputs con data-unsaved:', unsavedInputs.length);
    
    const hasUnsaved = dirtyForms.length > 0 || touchedForms.length > 0 || unsavedInputs.length > 0;
    console.log('   - Resultado final:', hasUnsaved);
    
    return hasUnsaved;
  }

  public notifyLogout(allowSave: boolean = true): void {
    console.log('📢 Notificando logout a otras pestañas...');
    const data: SessionExpirationData = {
      type: 'LOGOUT',
      message: 'Se ha cerrado la sesión desde otro dispositivo',
      allowSave,
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.SESSION_SYNC_KEY, JSON.stringify(data));
    console.log('💾 Datos guardados en localStorage:', data);
    
    setTimeout(() => {
      localStorage.removeItem(this.SESSION_SYNC_KEY);
      console.log('🧹 Datos limpiados de localStorage');
    }, 1000);
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