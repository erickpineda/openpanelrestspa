// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthSyncService } from './core/services/auth/auth-sync.service';
import { LoggerService } from './core/services/logger.service';
import { AuthService } from './core/services/auth/auth.service'; // inyectado para comprobar token
import { RouteTrackerService } from './core/services/auth/route-tracker.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'openpanelspa';
  loading: boolean = false;

  constructor(
    private authSync: AuthSyncService,
    private log: LoggerService,
    private authService: AuthService,
    private routeTracker: RouteTrackerService // sólo para activar el tracking
  ){ }

  ngOnInit(): void {
    // Inicializar sincronización entre pestañas
    this.authSync.initializeAuthState();

    // Luego comprobar token actual (si está caducado forzará logout)
    this.authService.ensureTokenValidOnInit();

    // Escuchar cambios de estado de autenticación
    window.addEventListener('authStateChanged', () => {
      this.log.info('🔄 Estado de autenticación cambiado, actualizando interfaz...');
      // Aquí podrías forzar la actualización de componentes si es necesario
    });
  }
}
