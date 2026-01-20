import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {
  SessionManagerService,
  SessionExpirationData,
} from '../../core/services/auth/session-manager.service';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { RouteTrackerService } from '../../core/services/auth/route-tracker.service';
import { PostLoginRedirectService } from '../services/auth/post-login-redirect.service';
import { OPConstants } from '../../shared/constants/op-global.constants';
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

  constructor(
    private router: Router,
    private sessionManager: SessionManagerService,
    private tokenStorage: TokenStorageService,
    private routeTracker: RouteTrackerService,
    private postLoginRedirect: PostLoginRedirectService,
    private log: LoggerService
  ) {}

  ngOnInit(): void {
    // Si estamos en login, no hacemos nada
    if (this.router.url.includes('/login')) {
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
      this.showModal();
    }

    // Nos suscribimos al evento global de expiración de sesión para mostrar modal en cualquier sitio
    this.subs.add(
      this.sessionManager.sessionExpired$.subscribe((data: SessionExpirationData) => {
        this.log.info('SessionExpiredComponent: Evento recibido', data);

        // Si es un logout voluntario con opción de guardado, dejamos que UnsavedWorkModal lo maneje
        if (data.type === 'LOGOUT' && data.allowSave) {
          this.log.info('SessionExpiredComponent: Ignorando evento (lo maneja UnsavedWorkModal)');
          return;
        }

        if (this.router.url.includes('/login')) {
          return;
        }

        // Si la sesión expiró, intentamos guardar trabajo pendiente automáticamente
        if (data.type === 'SESSION_EXPIRED') {
          const saveEvent = new CustomEvent(OPConstants.Events.SAVE_UNSAVED_WORK);
          window.dispatchEvent(saveEvent);
        }

        // Guarda datos y muestra modal
        this.sessionData = data;
        this.showModal();
      })
    );

    // Escuchar cambios de ruta para cerrar el modal si vamos al login
    this.subs.add(
      this.router.events.pipe(
        filter((event: any) => event instanceof NavigationStart)
      ).subscribe((event: any) => {
        if (event.url.includes('/login')) {
          this.hideModal();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private showModal(): void {
    this.isVisible = true;
  }

  private hideModal(): void {
    this.isVisible = false;
    this.sessionData = null;
  }

  // Si el usuario, por alguna razón, intenta cerrar el modal (visibleChange), lo evitamos/rehabilitamos
  onVisibleChange(visible: boolean): void {
    // Si estamos en login, permitimos que se cierre
    if (this.router.url.includes('/login')) {
      this.isVisible = false;
      return;
    }

    // Si se intentó cerrar y aún tenemos sessionData, reabrimos inmediatamente (evita cierre accidental).
    if (!visible && this.sessionData) {
      // Reestablece visible con micro-tick para no pelear con el control interno
      setTimeout(() => (this.isVisible = true), 0);
      return;
    }
    this.isVisible = visible;
  }

  goToLogin(): void {
    // 1. Ocultar modal (esto debería eliminar el backdrop, pero a veces falla en navegaciones rápidas)
    this.isVisible = false;
    this.sessionData = null;

    // 2. Forzar limpieza manual de backdrops huérfanos antes de navegar
    setTimeout(() => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach((backdrop) => backdrop.remove());
      
      // 3. Navegar después de la limpieza
      this.saveRedirectUrl();
      this.router.navigate(['/login'], { replaceUrl: true });
    }, 300); // Pequeño delay para permitir que la animación de cierre de CoreUI termine o se procese
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
    
    setTimeout(() => {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((backdrop) => backdrop.remove());

        this.router.navigate(['/'], { replaceUrl: true });
    }, 300);
  }
}
