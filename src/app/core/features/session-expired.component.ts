import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionManagerService, SessionExpirationData } from '../../core/services/auth/session-manager.service';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { RouteTrackerService } from '../../core/services/auth/route-tracker.service';
import { PostLoginRedirectService } from '../services/auth/post-login-redirect.service';

@Component({
    selector: 'app-session-expired-modal',
    templateUrl: './session-expired.component.html',
    styleUrls: ['./session-expired.component.scss'],
    standalone: false
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
    private postLoginRedirect: PostLoginRedirectService
  ) {}

  ngOnInit(): void {
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
        // Guarda datos y muestra modal
        this.sessionData = data;
        this.showModal();
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
    // Si se intentó cerrar y aún tenemos sessionData, reabrimos inmediatamente (evita cierre accidental).
    if (!visible && this.sessionData) {
      // Reestablece visible con micro-tick para no pelear con el control interno
      setTimeout(() => (this.isVisible = true), 0);
      return;
    }
    this.isVisible = visible;
  }

  goToLogin(): void {
    this.hideModal();
    // Guardar la última ruta válida (no la actual, que es session-expired)
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

    // replaceUrl evita que el usuario vuelva con back a la pantalla de sesión finalizada
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  goToHome(): void {
    this.hideModal();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
