import { Injectable } from '@angular/core';
import { Observable, interval, of, throwError } from 'rxjs';
import { catchError, switchMap, takeWhile, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SessionManagerService } from './session-manager.service';
import { LoggerService } from '../logger.service';
import { OPSessionConstants } from '../../../shared/constants/op-session.constants';

@Injectable({
  providedIn: 'root',
})
export class HeartbeatService {
  private heartbeatInterval: any;
  private isRunning = false;
  private consecutiveFailures = 0;
  private readonly HEARTBEAT_INTERVAL = 2 * 60 * 1000; // 2 minutos en milisegundos
  private readonly MAX_FAILURES = 3; // Máximo de fallos consecutivos antes de forzar logout

  constructor(
    private authService: AuthService,
    private sessionManager: SessionManagerService,
    private log: LoggerService
  ) {}

  startHeartbeat(): void {
    if (this.isRunning) {
      this.log.info('HeartbeatService: Ya esta corriendo');
      return;
    }

    if (!this.authService.isTokenValid()) {
      this.log.info('HeartbeatService: No hay token valido, no se inicia heartbeat');
      return;
    }

    this.isRunning = true;
    this.consecutiveFailures = 0;
    this.log.info('HeartbeatService: Iniciando verificacion periodica de sesion');

    this.heartbeatInterval = interval(this.HEARTBEAT_INTERVAL).pipe(
      takeWhile(() => this.isRunning),
      switchMap(() => this.checkSessionStatus()),
      tap(() => this.consecutiveFailures = 0),
      catchError((error) => {
        this.log.error('HeartbeatService: Error en verificacion de sesion', error);
        
        this.consecutiveFailures++;
        
        if (this.consecutiveFailures < this.MAX_FAILURES) {
          return of(null); // Continuar con el siguiente ciclo
        } else {
          this.log.warn('HeartbeatService: Maximo de fallos alcanzado, forzando logout');
          this.forceLogoutDueToHeartbeatFailures();
          return throwError(() => error);
        }
      })
    ).subscribe();
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      this.heartbeatInterval.unsubscribe();
      this.heartbeatInterval = null;
    }
    this.isRunning = false;
    this.log.info('HeartbeatService: Deteniendo verificacion periodica');
  }

  private checkSessionStatus(): Observable<any> {
    return this.authService.validateSessionStatus().pipe(
      switchMap((response) => {
        if (!response) {
          this.log.warn('HeartbeatService: Respuesta invalida del servidor');
          return of('invalid_response');
        }

        this.log.debug('HeartbeatService: Estado de sesion:', response);

        switch (response.status) {
          case 'VALID':
            this.log.debug('HeartbeatService: Sesion valida');
            return of(null); // Continuar normalmente
          
          case 'ORPHANED':
            this.log.warn('HeartbeatService: Sesion huerfana detectada');
            this.sessionManager.notifySessionOrphaned();
            return throwError(() => 'SESSION_ORPHANED');
          
          case 'ERROR':
            this.log.warn('HeartbeatService: Error transitorio en validacion de sesion',
              response.message);
            return of(null); // Error transitorio, reintentar en el proximo ciclo

          case 'INVALID':
          default:
            this.log.warn('HeartbeatService: Sesion invalida detectada');
            this.sessionManager.notifySessionExpired();
            return throwError(() => 'SESSION_INVALID');
        }
      })
    );
  }

  private forceLogoutDueToHeartbeatFailures(): void {
    try {
      this.sessionManager.notifySessionExpired();
    } catch (e) {
      this.log.error('HeartbeatService: Error forzando logout por fallos de heartbeat', e);
    }
    this.stopHeartbeat();
  }

  // Metodo publico para que otros servicios puedan verificar el estado
  isHeartbeatRunning(): boolean {
    return this.isRunning;
  }

  // Limpiar al destruir el servicio
  ngOnDestroy(): void {
    this.stopHeartbeat();
  }
}
