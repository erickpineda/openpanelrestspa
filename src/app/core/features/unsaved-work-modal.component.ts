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
    private unsavedWorkService: UnsavedWorkService // ✅ Inyectar servicio
  ) {}

  ngOnInit(): void {
    console.log('🔄 UnsavedWorkModalComponent: Inicializando...');
    
    this.subscription.add(
      this.sessionManager.sessionExpired$.subscribe(data => {
        console.log('📡 UnsavedWorkModalComponent: Evento recibido:', data);
        
        // ✅ Usar el servicio para detectar trabajo sin guardar
        const hasUnsavedWork = this.unsavedWorkService.hasUnsavedWork();
        console.log('🔍 Trabajo sin guardar (servicio):', hasUnsavedWork);
        
        // ✅ Verificar también con método de respaldo
        const hasUnsavedWorkBackup = this.hasUnsavedWorkBackup();
        console.log('🔍 Trabajo sin guardar (respaldo):', hasUnsavedWorkBackup);
        
        const shouldShowModal = data.allowSave && (hasUnsavedWork || hasUnsavedWorkBackup);
        
        if (shouldShowModal) {
          console.log('✅ Mostrando modal...');
          this.sessionData = data;
          this.showModal();
        } else {
          console.log('❌ No se muestra modal, redirigiendo...');
          this.sessionManager.performLogout(data);
        }
      })
    );

    window.addEventListener('saveWorkBeforeLogout', this.handleSaveWork.bind(this));
  }

  private hasUnsavedWorkBackup(): boolean {
    // Método de respaldo para detectar trabajo sin guardar
    const selectors = [
      'form[data-unsaved="true"]',
      '.unsaved-work-modified',
      'form.ng-dirty',
      'form.ng-touched'
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    window.removeEventListener('saveWorkBeforeLogout', this.handleSaveWork.bind(this));
  }

  private hasUnsavedWork(): boolean {
    // Método más específico para detectar trabajo sin guardar
    const selectors = [
      'form.ng-dirty',
      'form.ng-touched', 
      '[data-unsaved="true"]',
      'form[appUnsavedWork]'
    ];
    
    let totalElements = 0;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`🔍 Selector "${selector}": ${elements.length} elementos`);
      totalElements += elements.length;
    });
    
    console.log('📊 Total elementos sin guardar:', totalElements);
    return totalElements > 0;
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