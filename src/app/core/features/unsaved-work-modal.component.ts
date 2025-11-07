import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SessionManagerService, SessionExpirationData } from '../../core/services/session-manager.service';

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

  constructor(private sessionManager: SessionManagerService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.sessionManager.sessionExpired$.subscribe(data => {
        if (data.allowSave && this.hasUnsavedWork()) {
          this.sessionData = data;
          this.showModal();
        } else {
          this.sessionManager.performLogout(data);
        }
      })
    );

    // Escuchar evento para guardar trabajo
    window.addEventListener('saveWorkBeforeLogout', this.handleSaveWork.bind(this));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    window.removeEventListener('saveWorkBeforeLogout', this.handleSaveWork.bind(this));
  }

  private hasUnsavedWork(): boolean {
    // Lógica para detectar trabajo sin guardar
    return document.querySelectorAll('form.ng-dirty, [data-unsaved="true"]').length > 0;
  }

  private showModal(): void {
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