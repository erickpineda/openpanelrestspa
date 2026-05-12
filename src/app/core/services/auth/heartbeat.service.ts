import { Injectable } from '@angular/core';
import { Observable, interval, of, throwError } from 'rxjs';
import { catchError, map, switchMap, takeWhile, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SessionManagerService } from './session-manager.service';
import { LoggerService } from '../logger.service';
import { AjustesService } from '../data/ajustes.service';

@Injectable({
  providedIn: 'root',
})
export class HeartbeatService {
  private heartbeatSubscription: any;
  private isRunning = false;
  private consecutiveFailures = 0;
  private currentIntervalMs = 2 * 60 * 1000;
  private readonly MAX_FAILURES = 3;
  private readonly MINIMUM_INTERVAL_MS = 5000;
  private readonly SETTING_KEY = 'session.heartbeat.intervalMs';

  constructor(
    private authService: AuthService,
    private sessionManager: SessionManagerService,
    private log: LoggerService,
    private ajustesService: AjustesService
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

    this.startSubscription();

    this.loadIntervalFromSettings();
  }

  private startSubscription(intervalMs?: number): void {
    this.stopHeartbeat();
    this.currentIntervalMs = intervalMs ?? this.currentIntervalMs;
    this.isRunning = true;

    this.heartbeatSubscription = interval(this.currentIntervalMs).pipe(
      takeWhile(() => this.isRunning),
      switchMap(() => this.checkSessionStatus()),
      tap(() => this.consecutiveFailures = 0),
      catchError((error) => {
        this.log.error('HeartbeatService: Error en verificacion de sesion', error);

        this.consecutiveFailures++;

        if (this.consecutiveFailures < this.MAX_FAILURES) {
          return of(null);
        } else {
          this.log.warn('HeartbeatService: Maximo de fallos alcanzado, forzando logout');
          this.forceLogoutDueToHeartbeatFailures();
          return throwError(() => error);
        }
      })
    ).subscribe();
  }

  private loadIntervalFromSettings(): void {
    this.ajustesService.obtenerPorIdSafe(this.SETTING_KEY).pipe(
      map((setting) => {
        const raw = setting?.valor ?? setting?.valorPorDefecto;
        const parsed = parseInt(raw ?? '', 10);
        return !isNaN(parsed) && parsed > 0 ? Math.max(parsed, this.MINIMUM_INTERVAL_MS) : this.currentIntervalMs;
      }),
      catchError(() => of(this.currentIntervalMs))
    ).subscribe((configuredMs) => {
      if (configuredMs !== this.currentIntervalMs) {
        this.log.info(`HeartbeatService: Intervalo configurado=${configuredMs}ms, reiniciando`);
        this.startSubscription(configuredMs);
      }
    });
  }

  stopHeartbeat(): void {
    if (this.heartbeatSubscription) {
      this.heartbeatSubscription.unsubscribe();
      this.heartbeatSubscription = null;
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
