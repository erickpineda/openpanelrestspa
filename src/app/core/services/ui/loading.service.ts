import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { LoggerService } from '../logger.service';

export interface LoadingState {
  global: boolean;
  requests: Map<string, boolean>; // Track individual requests
}

export interface LoadingErrorState {
  active: boolean;
  message?: string;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private stateSubject = new BehaviorSubject<LoadingState>({
    global: false,
    requests: new Map()
  });
  
  public state$ = this.stateSubject.asObservable();
  public globalLoading$: Observable<boolean> = this.state$.pipe(
    map(state => state.global),
    distinctUntilChanged()
  );

  private httpRequestCount = 0;
  private minimumDisplayTime = 500;
  private loadingStartTime = 0;
  private loadingTimeout: any;
  private maxWaitMs = 30000;
  private maxWaitTimer: any;

  private errorSubject = new BehaviorSubject<LoadingErrorState>({ active: false });
  public error$ = this.errorSubject.asObservable();

  private retryHandler?: () => void;

  constructor(private logger: LoggerService, private notifications: NotificationService) {}

  setGlobalLoading(loading: boolean, requestId?: string): void {
    if (loading) {
      this.httpRequestCount++;
      
      if (this.httpRequestCount === 1) {
        this.loadingStartTime = Date.now();
        this.updateGlobalState(true);
        this.logger.debug('Loading global iniciado');

        // Iniciar temporizador de espera máxima
        this.startMaxWaitTimer();
      }

      // Track individual request if ID provided
      if (requestId) {
        this.trackRequest(requestId, true);
      }
    } else {
      this.httpRequestCount = Math.max(0, this.httpRequestCount - 1);
      
      // Remove individual request tracking
      if (requestId) {
        this.trackRequest(requestId, false);
      }

      if (this.httpRequestCount === 0) {
        this.scheduleLoadingStop();
        this.clearMaxWaitTimer();
        this.clearError();
      }
    }
  }

  private scheduleLoadingStop(): void {
    const elapsed = Date.now() - this.loadingStartTime;
    const remaining = Math.max(0, this.minimumDisplayTime - elapsed);
    
    // Clear existing timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    
    this.loadingTimeout = setTimeout(() => {
      // Double-check that no new requests came in during the wait
      if (this.httpRequestCount === 0) {
        this.updateGlobalState(false);
        this.logger.debug('Loading global finalizado');
      }
    }, remaining);
  }

  private startMaxWaitTimer(): void {
    this.clearMaxWaitTimer();
    this.maxWaitTimer = setTimeout(() => {
      // Si sigue cargando después del tiempo máximo, disparar error
      if (this.httpRequestCount > 0) {
        const msg = 'Tiempo de espera agotado. El servidor no responde.';
        this.setError(msg, 'TIMEOUT');
        this.notifications.error(msg, 'Error de conexión');
        this.logger.error('Loading global timeout alcanzado (30s): backend no responde');
        // Detener loader
        this.forceStopLoading();
      }
    }, this.maxWaitMs);
  }

  private clearMaxWaitTimer(): void {
    if (this.maxWaitTimer) {
      clearTimeout(this.maxWaitTimer);
      this.maxWaitTimer = null;
    }
  }

  private updateGlobalState(global: boolean): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      global
    });
  }

  private trackRequest(requestId: string, loading: boolean): void {
    const currentState = this.stateSubject.value;
    const newRequests = new Map(currentState.requests);
    
    if (loading) {
      newRequests.set(requestId, true);
    } else {
      newRequests.delete(requestId);
    }
    
    this.stateSubject.next({
      ...currentState,
      requests: newRequests
    });
  }

  // Método para forzar el cierre del loading (en casos de error)
  forceStopLoading(): void {
    this.httpRequestCount = 0;
    this.updateGlobalState(false);
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
    this.clearMaxWaitTimer();
    this.logger.warn('Loading forzado a detenerse');
  }

  // Estado de error
  setError(message: string, code?: string): void {
    this.errorSubject.next({ active: true, message, code });
  }

  clearError(): void {
    this.errorSubject.next({ active: false });
  }

  // Reintento configurable
  registerRetryHandler(handler: () => void): void {
    this.retryHandler = handler;
  }

  triggerRetry(): void {
    this.logger.info('Loading: usuario solicitó reintento');
    this.clearError();
    // Reiniciar loader
    this.setGlobalLoading(true);
    try {
      if (this.retryHandler) {
        this.retryHandler();
      } else {
        // Fallback: recargar página
        window.location.reload();
      }
    } catch (e) {
      this.logger.error('Error ejecutando retryHandler', e);
      this.notifications.error('No se pudo reintentar la operación');
      this.forceStopLoading();
    }
  }

  // Obtener estadísticas
  getLoadingStats() {
    return {
      activeRequests: this.httpRequestCount,
      trackedRequests: this.stateSubject.value.requests.size,
      isLoading: this.httpRequestCount > 0
    };
  }
}