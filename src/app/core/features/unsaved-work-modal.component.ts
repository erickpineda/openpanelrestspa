// unsaved-work-modal.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  SessionManagerService,
  SessionExpirationData,
} from '../../core/services/auth/session-manager.service';
import { UnsavedWorkService } from '../services/utils/unsaved-work.service';
import { TemporaryStorageService } from '../../core/services/ui/temporary-storage.service';
import { LoggerService } from '../services/logger.service';
import { OPConstants } from '../../shared/constants/op-global.constants';

@Component({
  selector: 'app-unsaved-work-modal',
  templateUrl: './unsaved-work-modal.component.html',
  styleUrls: ['./unsaved-work-modal.component.scss'],
  standalone: false,
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
    private temporaryStorage: TemporaryStorageService,
    private log: LoggerService
  ) {}

  ngOnInit(): void {
    this.log.info('🔄 UnsavedWorkModalComponent: Inicializando...');

    this.subscription.add(
      this.sessionManager.sessionExpired$.subscribe((data) => {
        this.log.info('📡 UnsavedWorkModalComponent: Evento recibido:', data);

        const isLogoutWithSave = data.type === 'LOGOUT' && data.allowSave === true;
        this.log.info('🔍 Es logout con allowSave:', isLogoutWithSave);

        if (isLogoutWithSave) {
          // Validation: Check if there is ACTUAL unsaved work before showing the modal
          if (this.unsavedWorkService.hasUnsavedWork()) {
            this.log.info('✅ Mostrando modal porque es LOGOUT con allowSave y hay trabajo sin guardar');
            this.sessionData = data;
            this.showModal();
          } else {
            this.log.info('⚠️ LOGOUT con allowSave pero sin trabajo real detectado. Procediendo a logout...');
            this.sessionManager.performLogout(data);
          }
        } else {
          this.log.info('❌ No se muestra modal, redirigiendo...');
          this.sessionManager.performLogout(data);
        }
      })
    );

    window.addEventListener(
      OPConstants.Events.SAVE_WORK_BEFORE_LOGOUT,
      this.handleSaveWork.bind(this)
    );
    this.log.info('✅ UnsavedWorkModalComponent: Inicializado correctamente');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    window.removeEventListener(
      OPConstants.Events.SAVE_WORK_BEFORE_LOGOUT,
      this.handleSaveWork.bind(this)
    );
  }

  private showModal(): void {
    this.log.info('🎬 Mostrando modal...');
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
    const saveEvent = new CustomEvent(OPConstants.Events.SAVE_UNSAVED_WORK);
    window.dispatchEvent(saveEvent);

    // Esperar un poco para que se complete el guardado temporal
    setTimeout(() => {
      this.saveInProgress = false;
      this.saveCompleted = true;

      this.log.info('✅ Guardado temporal completado');

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
