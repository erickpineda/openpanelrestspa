import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { UnsavedWorkService } from './unsaved-work.service';

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

  constructor(
    private tokenStorage: TokenStorageService,
    private unsavedWorkService: UnsavedWorkService,
    private router: Router
  ) {
    this.setupSessionSync();
  }

  private setupSessionSync(): void {
    console.log('🔄 SessionManagerService: Configurando sincronización');
    
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

    // Verificar periódicamente
    setInterval(() => {
      this.checkPendingEvents();
    }, 5000);

    console.log('✅ SessionManagerService: Sincronización configurada');
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
        console.log('📥 Evento pendiente encontrado:', pendingEvent);
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
    console.log('🔄 SessionManagerService: Manejando cambio de sesión:', sessionData);
    
    try {
      const data = JSON.parse(sessionData);
      console.log('📊 Datos parseados:', data);
      
      if (data.type === 'LOGOUT') {
        this.handleLogout(data);
      }
    } catch (e) {
      console.error('❌ Error parsing session data:', e);
    }
  }

  private handleLogout(data: any): void {
    console.log('🚪 SessionManagerService: Manejando logout...');
    
    const logoutData: SessionExpirationData = {
      type: 'LOGOUT',
      message: 'Se ha cerrado la sesión desde otro dispositivo',
      allowSave: true,
      timestamp: data.timestamp || Date.now()
    };

    // Verificar trabajo sin guardar
    const hasUnsavedWork = this.unsavedWorkService.hasUnsavedWork();
    console.log('📝 Trabajo sin guardar (servicio):', hasUnsavedWork);
    
    const hasUnsavedWorkBackup = this.checkUnsavedWorkBackup();
    console.log('📝 Trabajo sin guardar (respaldo):', hasUnsavedWorkBackup);
    
    const shouldShowModal = hasUnsavedWork || hasUnsavedWorkBackup;
    
    if (shouldShowModal && logoutData.allowSave) {
      console.log('📢 Emitiendo evento para mostrar modal...');
      this.sessionExpiredSubject.next(logoutData);
    } else {
      console.log('🔓 Forzando logout inmediato...');
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
      console.log(`🔍 Selector "${selector}": ${elements.length} elementos`);
      totalElements += elements.length;
    });
    
    console.log('📊 Total elementos sin guardar (respaldo):', totalElements);
    return totalElements > 0;
  }

  public notifyLogout(allowSave: boolean = true): void {
    console.log('📢 SessionManagerService: Notificando logout a otras pestañas...');
    
    const data = {
      type: 'LOGOUT',
      allowSave,
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.SESSION_SYNC_KEY, JSON.stringify(data));
    localStorage.setItem(this.SESSION_TIMESTAMP_KEY, Date.now().toString());
    
    console.log('💾 Datos guardados en localStorage:', data);
    
    setTimeout(() => {
      this.cleanupSyncData();
    }, 30000);
  }

  private cleanupSyncData(): void {
    localStorage.removeItem(this.SESSION_SYNC_KEY);
    localStorage.removeItem(this.SESSION_TIMESTAMP_KEY);
    console.log('🧹 Datos de sync limpiados');
  }

  public performLogout(data: SessionExpirationData): void {
    console.log('🚀 SessionManagerService: Ejecutando performLogout...');
    this.tokenStorage.signOut();
    
    this.router.navigate(['/session-expired'], { 
      state: { sessionData: data }
    });
  }

  public handleLogoutFromSync(data: any): void {
    console.log('🔄 SessionManager: Logout desde sync recibido', data);
    
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
}