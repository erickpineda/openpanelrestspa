import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {
  SessionManagerService,
  SessionExpirationData,
} from '../../core/services/auth/session-manager.service';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { RouteTrackerService } from '../../core/services/auth/route-tracker.service';
import { PostLoginRedirectService } from '../services/auth/post-login-redirect.service';
import { UnsavedWorkService } from '../services/utils/unsaved-work.service';
import { TemporaryStorageService } from '../../core/services/ui/temporary-storage.service';
import { ActiveTabService } from '../services/ui/active-tab.service';
import { OPConstants } from '../../shared/constants/op-global.constants';
import { OPSessionConstants } from '../../shared/constants/op-session.constants';
import { LoggerService } from '../services/logger.service';

@Component({
  selector: 'app-session-expired-modal',
  templateUrl: './session-expired.component.html',
  styleUrls: ['./session-expired.component.scss'],
  standalone: false,
})
export class SessionExpiredComponent implements OnInit, OnDestroy {
  private subs = new Subscription();

  isVisible = false;
  sessionData: SessionExpirationData | null = null;
  timeSinceExpiry: string = '';
  private timerInterval: any;

  constructor(
    private router: Router,
    private sessionManager: SessionManagerService,
    private tokenStorage: TokenStorageService,
    private routeTracker: RouteTrackerService,
    private postLoginRedirect: PostLoginRedirectService,
    private unsavedWorkService: UnsavedWorkService,
    private temporaryStorage: TemporaryStorageService,
    private activeTabService: ActiveTabService,
    private log: LoggerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.log.info('SessionExpiredComponent: Inicializando...');
    // Si estamos en login, no hacemos nada
    if (this.router.url.includes('/login')) {
      this.log.info('SessionExpiredComponent: En login, no se activa');
      return;
    }

    // Si la navegación actual trae sessionData (fallback)
    const navigation = this.router.currentNavigation();
    this.sessionData =
      navigation?.extras?.state?.['sessionData'] ||
      (window.history && (window.history.state as any)?.sessionData) ||
      null;

    // Si ya hay sessionData al montar, mostramos el modal
    if (this.sessionData) {
      this.log.info('SessionExpiredComponent: Datos encontrados al iniciar', this.sessionData);
      this.showModal();
    }

    // Nos suscribimos al evento global de expiración de sesión para mostrar modal en cualquier sitio
    this.subs.add(
      this.sessionManager.sessionExpired$.subscribe((data: SessionExpirationData) => {
        this.log.info('SessionExpiredComponent: Evento recibido', data);

        // Verificación crítica: Si es cierre manual LOCAL, nunca mostrar modal.
        if (data.isManual && data.origin === 'local') {
          this.log.info('SessionExpiredComponent: Ignorando logout manual local explícito');
          return;
        }

        // --- LÓGICA DE DELEGACIÓN CENTRALIZADA ---
        // Verificamos si este componente debe ceder el control al UnsavedWorkModalComponent.
        // Esto aplica tanto para LOGOUT (remoto/con guardado) como para SESSION_EXPIRED.
        
        const isCreateEntryActive = 
          this.activeTabService.isFeatureActiveInCurrentTab('create-entry') || 
          this.router.url.includes('/entradas/crear');

        const hasUnsavedWork = this.unsavedWorkService.hasUnsavedWork();

        if (isCreateEntryActive) {
          this.log.info(
            'SessionExpiredComponent: En /entradas/crear (Tab Active). Delegando SIEMPRE a UnsavedWorkModalComponent (Prioridad Absoluta).'
          );
          return;
        }

        if (hasUnsavedWork) {
          this.log.info(
            'SessionExpiredComponent: Detectado trabajo sin guardar. Delegando a UnsavedWorkModalComponent.'
          );
          return;
        }
        // -----------------------------------------

        // Si es un logout voluntario local con opción de guardado, dejamos que UnsavedWorkModal lo maneje
        // (Aunque la lógica de arriba ya lo debería cubrir si hay trabajo, esto es por seguridad de flujo)
        if (data.type === OPSessionConstants.TYPE_LOGOUT && data.allowSave) {
          if (data.origin === 'local') {
            this.log.info(
              'SessionExpiredComponent: Ignorando logout local (lo maneja UnsavedWorkModal)'
            );
            return;
          }
        }

        if (this.router.url.includes('/login')) {
          this.log.info('SessionExpiredComponent: Ignorando evento por estar en /login');
          return;
        }

        // Si la sesión expiró
        if (data.type === OPSessionConstants.TYPE_SESSION_EXPIRED) {
          this.log.info('SessionExpiredComponent: Intentando auto-guardado por sesión expirada');
          // Lanzamos el evento por si acaso algún componente no registrado quiere guardar.
          const saveEvent = new CustomEvent(OPConstants.Events.SAVE_UNSAVED_WORK);
          window.dispatchEvent(saveEvent);
          
          this.startTimer(data.timestamp);
        } else {
          this.stopTimer();
        }

        // Guarda datos y muestra modal
        this.sessionData = data;
        this.showModal();
      })
    );

    // Escuchar restauración de sesión (login en otra pestaña)
    this.subs.add(
      this.sessionManager.sessionRestored$.subscribe(() => {
        this.log.info('SessionExpiredComponent: Sesión restaurada, cerrando modal');
        this.hideModal();
        // Opcional: recargar o navegar a home si estamos atrapados en el modal
        // Pero hideModal ya hace isVisible = false.
        // Si estábamos en una ruta protegida, el guard/interceptor funcionarán ahora.
      })
    );

    // Escuchar cambios de ruta
    this.subs.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          // Si vamos al login, ocultamos el modal...
          if (event.url.includes('/login')) {
            // ...PERO si la navegación lleva sessionData (por redirección de AuthGuard),
            // no lo ocultamos, o lo dejamos para que NavigationEnd lo maneje.
            const nav = this.router.getCurrentNavigation();
            const hasSessionData = nav?.extras?.state?.['sessionData'];
            
            if (!hasSessionData) {
               this.hideModal();
            }
          }
        }

        if (event instanceof NavigationEnd) {
           // Al terminar la navegación, verificamos si hay sessionData en el state
           // Esto es crucial si AuthGuard nos redirigió al login con state
           const nav = this.router.getCurrentNavigation();
           const state = nav?.extras?.state || window.history.state;
           
           if (state?.sessionData) {
             this.log.info('SessionExpiredComponent: sessionData detectado en NavigationEnd', state.sessionData);
             this.sessionData = state.sessionData;
             this.showModal();
           }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.stopTimer();
  }

  private startTimer(timestamp: number) {
    this.stopTimer();
    this.updateTime(timestamp);
    this.timerInterval = setInterval(() => this.updateTime(timestamp), 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timeSinceExpiry = '';
  }

  private updateTime(timestamp: number) {
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - timestamp) / 1000));
    
    // Format: "Hace X minutos y Y segundos" or just "Hace X segundos"
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    
    if (minutes > 0) {
      this.timeSinceExpiry = `Hace ${minutes} min y ${seconds} seg`;
    } else {
      this.timeSinceExpiry = `Hace ${seconds} seg`;
    }
    // Force detection manually if needed, but Angular usually picks up timer changes if in zone.
    // However, since we use OnPush sometimes or detached, let's be safe if we were Detached.
    // But this component is default strategy.
    this.cdr.detectChanges(); 
  }

  private showModal(): void {
    this.log.info('SessionExpiredComponent: showModal() llamado. Mostrando modal.');
    // Usamos setTimeout para asegurar que el cambio de visibilidad ocurra en el siguiente ciclo
    // y evitar problemas con actualizaciones de vista síncronas o conflictos con otros modales.
    setTimeout(() => {
      this.isVisible = true;
      this.cdr.detectChanges(); // Forzar detección de cambios
    }, 0);
  }

  private hideModal(): void {
    this.isVisible = false;
    this.sessionData = null;
  }

  // Si el usuario, por alguna razón, intenta cerrar el modal (visibleChange), lo evitamos/rehabilitamos
  onVisibleChange(visible: boolean): void {
    this.log.info('SessionExpiredComponent: onVisibleChange', visible);
    // Si estamos en login, permitimos que se cierre
    if (this.router.url.includes('/login')) {
      this.isVisible = false;
      return;
    }

    // Si se intentó cerrar y aún tenemos sessionData, reabrimos inmediatamente (evita cierre accidental).
    if (!visible && this.sessionData) {
      this.log.info('SessionExpiredComponent: Intento de cierre prevenido (sessionData presente)');
      // Reestablece visible con micro-tick para no pelear con el control interno
      setTimeout(() => {
        this.isVisible = true;
        this.cdr.detectChanges();
      }, 0);
      return;
    }
    this.isVisible = visible;
  }

  goToLogin(): void {
    // 1. Ocultar modal
    this.isVisible = false;
    this.sessionData = null;
    this.cdr.detectChanges();

    // 2. Esperar cierre de animación y limpiar backdrops
    setTimeout(() => {
      this.cleanupVisualArtifacts();
      this.saveRedirectUrl();

      // LIMPIEZA CRÍTICA: Asegurar que el token inválido se elimine antes de navegar
      this.tokenStorage.signOut();
      this.activeTabService.clearCurrentTab();
      
      this.router.navigate(['/login'], { replaceUrl: true }).then((success) => {
        if (!success) {
          this.log.warn('SessionExpiredComponent: Navegación por Router falló, forzando recarga.');
          window.location.href = '/login';
        }
      });
    }, 500);
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

  private saveRedirectUrl(): void {
    try {
      let validUrl: string | null = null;
      try {
        validUrl = RouteTrackerService.getLastValidUrl();
      } catch {}
      if (!validUrl) {
        validUrl = null;
      }
      if (validUrl) {
        this.postLoginRedirect.saveLastValidRoute(validUrl);
      }
    } catch {}
  }

  goToHome(): void {
    this.isVisible = false;
    this.sessionData = null;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.cleanupVisualArtifacts();
      
      // LIMPIEZA CRÍTICA: Asegurar que el token inválido se elimine antes de navegar
      this.tokenStorage.signOut();
      this.activeTabService.clearCurrentTab();

      this.router.navigate(['/'], { replaceUrl: true });
    }, 300);
  }
}
