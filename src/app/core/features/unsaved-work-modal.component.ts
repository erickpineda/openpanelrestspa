// unsaved-work-modal.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  SessionManagerService,
  SessionExpirationData,
} from '../../core/services/auth/session-manager.service';
import { UnsavedWorkService } from '../services/utils/unsaved-work.service';
import { TemporaryStorageService } from '../../core/services/ui/temporary-storage.service';
import { ActiveTabService } from '../services/ui/active-tab.service';
import { LoggerService } from '../services/logger.service';
import { OPConstants } from '../../shared/constants/op-global.constants';
import { OPSessionConstants } from '../../shared/constants/op-session.constants';

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
    private activeTabService: ActiveTabService,
    private log: LoggerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.log.info('🔄 UnsavedWorkModalComponent: Inicializando...');

    this.subscription.add(
      this.sessionManager.sessionExpired$.subscribe((data) => {
        this.log.info('📡 UnsavedWorkModalComponent: Evento recibido:', data);

        const isLogoutWithSave =
          data.type === OPSessionConstants.TYPE_LOGOUT && data.allowSave === true;
        this.log.info(
          `🔍 Análisis de evento: type=${data.type}, allowSave=${data.allowSave}, isLogoutWithSave=${isLogoutWithSave}, origin=${data.origin}`
        );

        // --- LÓGICA UNIFICADA ---
        // Determinamos si estamos en una pantalla crítica (Crear Entrada)
        const isCreateEntryActive =
          this.activeTabService.isFeatureActiveInCurrentTab('create-entry') ||
          this.router.url.includes('/entradas/crear');

        // Determinamos si hay trabajo pendiente
        const hasUnsavedWork = this.unsavedWorkService.hasUnsavedWork();
        const hasTemporaryData = this.temporaryStorage.hasAnyTemporaryData();

        // Exclusivo para pantalla de creación: solo mostrar si está activa
        const shouldShowModal = isCreateEntryActive;

        // Caso 1: LOGOUT (Remote) con allowSave
        if (isLogoutWithSave && data.origin === 'remote') {
          if (shouldShowModal) {
            this.log.info('✅ Mostrando modal por LOGOUT REMOTO con trabajo pendiente/activo');
            this.sessionData = data;
            this.showModal();
            return;
          }
        }

        // Caso 2: LOGOUT (Local) con allowSave
        if (isLogoutWithSave && data.origin === 'local') {
          if (shouldShowModal) {
            this.log.info('✅ Mostrando modal por LOGOUT LOCAL con trabajo pendiente/activo');
            this.sessionData = data;
            this.showModal();
            return;
          } else {
            // Si no hay trabajo, logout directo
            this.log.info('⚠️ LOGOUT LOCAL sin trabajo pendiente. Procediendo...');
            this.sessionManager.performLogout(data);
            return;
          }
        }

        // Caso 3: SESSION_EXPIRED
        if (data.type === OPSessionConstants.TYPE_SESSION_EXPIRED) {
          if (shouldShowModal) {
            this.log.info('✅ Mostrando modal por SESSION_EXPIRED con trabajo pendiente/activo');
            this.sessionData = data;
            this.showModal();
            return;
          } else {
            this.log.info(
              'ℹ️ SESSION_EXPIRED sin trabajo pendiente, delegando a SessionExpiredComponent'
            );
            // No hacemos nada, SessionExpiredComponent mostrará su modal (porque su check shouldDelegate fallará)
            return;
          }
        }

        // Caso Default: Logout sin save o eventos desconocidos
        this.log.info('❌ Evento no manejado por UnsavedWorkModal, redirigiendo...');
        this.sessionManager.performLogout(data);
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

    const saveTempEvent = new CustomEvent(OPConstants.Events.SAVE_FORM_DATA);
    window.dispatchEvent(saveTempEvent);

    // Esperar un poco para que se complete el guardado temporal
    setTimeout(() => {
      this.saveInProgress = false;
      this.saveCompleted = true;

      this.log.info('✅ Guardado temporal completado');

      setTimeout(() => {
        this.hideModal();
        this.performFinalLogout();
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
    this.performFinalLogout();
  }

  private performFinalLogout(): void {
    this.cleanupVisualArtifacts();
    // Forzamos un logout local para que redirija a Home (/) en lugar de Login
    // Esto cumple el requisito: "una vez acabe entonces ha de volver al home"
    const logoutData: SessionExpirationData = {
      type: OPSessionConstants.TYPE_LOGOUT as 'LOGOUT',
      origin: 'local',
      message: 'Sesión finalizada tras gestión de trabajo',
      timestamp: Date.now(),
      allowSave: false,
    };
    this.sessionManager.performLogout(logoutData);
  }

  private cleanupVisualArtifacts(): void {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((backdrop) => {
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    });
  }
}
