// app.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthSyncService } from './core/services/auth/auth-sync.service';
import { LoggerService } from './core/services/logger.service';

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
    private log: LoggerService
  ){ }

  ngOnInit(): void {
    // ✅ Inicializar sincronización de autenticación
    this.authSync.initializeAuthState();
    
    // Escuchar cambios de estado de autenticación
    window.addEventListener('authStateChanged', () => {
      this.log.info('🔄 Estado de autenticación cambiado, actualizando interfaz...');
      // Aquí podrías forzar la actualización de componentes si es necesario
    });
  }
}