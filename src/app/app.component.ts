// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from './core/services/auth/token-storage.service';
import { AuthSyncService } from './core/services/auth/auth-sync.service';
import { LoggerService } from './core/services/logger.service';
import { AuthService } from './core/services/auth/auth.service'; // inyectado para comprobar token
import { RouteTrackerService } from './core/services/auth/route-tracker.service';
import { OPConstants } from './shared/constants/op-global.constants';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent implements OnInit {
  title = 'openpanelspa';
  loading: boolean = false;

  constructor(
    private authSync: AuthSyncService,
    private log: LoggerService,
    private authService: AuthService,
    private routeTracker: RouteTrackerService, // sólo para activar el tracking
    private tokenStorage: TokenStorageService
  ){ }

  ngOnInit(): void {
    // Inicializar sincronización entre pestañas
    this.authSync.initializeAuthState();

    // Luego comprobar token actual (si está caducado forzará logout)
    this.authService.ensureTokenValidOnInit();

    // Mantenimiento periódico de post-login-redirect + limpieza inicial
    this.tokenStorage.cleanExpiredPostLoginRedirects();
    this.tokenStorage.startPostLoginRedirectMaintenance(60 * 60 * 1000);

    // Escuchar cambios de estado de autenticación
    window.addEventListener(OPConstants.Events.AUTH_STATE_CHANGED, () => {
      this.log.info('🔄 Estado de autenticación cambiado, actualizando interfaz...');
      // Aquí podrías forzar la actualización de componentes si es necesario
    });
  }
}
