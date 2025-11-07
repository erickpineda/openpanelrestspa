import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SessionManagerService, SessionExpirationData } from '../../core/services/session-manager.service';
import { UnsavedWorkService } from '../services/unsaved-work.service';

@Component({
  selector: 'app-unsaved-work-modal',
  templateUrl: './unsaved-work-modal.component.html',
  styleUrls: ['./unsaved-work-modal.component.scss']
})
export class UnsavedWorkModalComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  isVisible = false;
  sessionData: SessionExpirationData | null = null;
  saveInProgress = false;
  saveCompleted = false;

  constructor(
    private sessionManager: SessionManagerService,
    private unsavedWorkService: UnsavedWorkService
  ) {}

  ngOnInit(): void {
    console.log('🔄 UnsavedWorkModalComponent: Inicializando...');
    
    this.subscription.add(
      this.sessionManager.sessionExpired$.subscribe(data => {
        console.log('📡 UnsavedWorkModalComponent: Evento recibido:', data);
        
        // ✅ Verificar específicamente que sea LOGOUT y allowSave sea true
        const isLogoutWithSave = data.type === 'LOGOUT' && data.allowSave === true;
        console.log('🔍 Es logout con allowSave:', isLogoutWithSave);
        
        if (isLogoutWithSave) {
          console.log('✅ Mostrando modal porque es LOGOUT con allowSave');
          this.sessionData = data;
          this.showModal();
        } else {
          console.log('❌ No se muestra modal, redirigiendo... Tipo:', data.type, 'allowSave:', data.allowSave);
          this.sessionManager.performLogout(data);
        }
      })
    );

    window.addEventListener('saveWorkBeforeLogout', this.handleSaveWork.bind(this));
    console.log('✅ UnsavedWorkModalComponent: Inicializado correctamente');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    window.removeEventListener('saveWorkBeforeLogout', this.handleSaveWork.bind(this));
  }

  private showModal(): void {
    console.log('🎬 Mostrando modal...');
    this.isVisible = true;
    // Forzar detección de cambios
    setTimeout(() => {
      console.log('👁️ Modal visible:', this.isVisible);
    }, 0);
  }

  private hideModal(): void {
    this.isVisible = false;
  }

  private handleSaveWork(event: any): void {
    this.startSaveProcess();
  }

  startSaveProcess(): void {
    this.saveInProgress = true;
    
    // Emitir evento para que los componentes guarden su trabajo
    const saveEvent = new CustomEvent('saveUnsavedWork');
    window.dispatchEvent(saveEvent);
    
    // Simular proceso de guardado (reemplazar con lógica real)
    setTimeout(() => {
      this.saveInProgress = false;
      this.saveCompleted = true;
      
      // Cerrar modal después de 2 segundos y hacer logout
      setTimeout(() => {
        this.hideModal();
        if (this.sessionData) {
          this.sessionManager.performLogout(this.sessionData);
        }
      }, 2000);
    }, 3000);
  }

  saveAndContinue(): void {
    this.startSaveProcess();
  }

  logoutWithoutSaving(): void {
    this.hideModal();
    if (this.sessionData) {
      this.sessionManager.performLogout(this.sessionData);
    }
  }
}
