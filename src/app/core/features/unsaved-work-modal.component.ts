// unsaved-work-modal.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SessionManagerService, SessionExpirationData } from '../../core/services/session-manager.service';
import { UnsavedWorkService } from '../services/unsaved-work.service';
import { TemporaryStorageService } from '../../core/services/temporary-storage.service';

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
    private unsavedWorkService: UnsavedWorkService,
    private temporaryStorage: TemporaryStorageService
  ) {}

  ngOnInit(): void {
    console.log('🔄 UnsavedWorkModalComponent: Inicializando...');
    
    this.subscription.add(
      this.sessionManager.sessionExpired$.subscribe(data => {
        console.log('📡 UnsavedWorkModalComponent: Evento recibido:', data);
        
        const isLogoutWithSave = data.type === 'LOGOUT' && data.allowSave === true;
        console.log('🔍 Es logout con allowSave:', isLogoutWithSave);
        
        if (isLogoutWithSave) {
          console.log('✅ Mostrando modal porque es LOGOUT con allowSave');
          this.sessionData = data;
          this.showModal();
        } else {
          console.log('❌ No se muestra modal, redirigiendo...');
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
  }

  private hideModal(): void {
    this.isVisible = false;
  }

  private handleSaveWork(event: any): void {
    this.startSaveProcess();
  }

  startSaveProcess(): void {
    this.saveInProgress = true;
    
    // Disparar evento para que los componentes guarden
    const saveEvent = new CustomEvent('saveUnsavedWork');
    window.dispatchEvent(saveEvent);
    
    // Esperar un poco para que se complete el guardado temporal
    setTimeout(() => {
      this.saveInProgress = false;
      this.saveCompleted = true;
      
      console.log('✅ Guardado temporal completado');
      
      setTimeout(() => {
        this.hideModal();
        if (this.sessionData) {
          this.sessionManager.performLogout(this.sessionData);
        }
      }, 2000);
    }, 2000); // Reducido a 2 segundos para el guardado temporal
  }

  saveAndContinue(): void {
    this.startSaveProcess();
  }

  logoutWithoutSaving(): void {
    // Limpiar datos temporales si el usuario elige no guardar
    this.temporaryStorage.clearAllTemporaryEntries();
    
    this.hideModal();
    if (this.sessionData) {
      this.sessionManager.performLogout(this.sessionData);
    }
  }
}