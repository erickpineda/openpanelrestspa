import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionManagerService, SessionExpirationData } from '../../core/services/auth/session-manager.service';

@Component({
  selector: 'app-session-expired-modal',
  templateUrl: './session-expired.component.html',
  styleUrls: ['./session-expired.component.scss']
})
export class SessionExpiredComponent implements OnInit, OnDestroy {
  private subs = new Subscription();

  isVisible = false;
  sessionData: SessionExpirationData | null = null;

  constructor(
    private router: Router,
    private sessionManager: SessionManagerService
  ) {}

  ngOnInit(): void {
    // Si la navegación actual trae sessionData (fallback)
    const navigation = this.router.getCurrentNavigation();
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
    // replaceUrl evita que el usuario vuelva con back a la pantalla de sesión finalizada
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  goToHome(): void {
    this.hideModal();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
