import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { LoggerService } from '../logger.service';

export interface LoadingState {
  global: boolean;
  requests: Map<string, boolean>; // Track individual requests
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

  constructor(private logger: LoggerService) {}

  setGlobalLoading(loading: boolean, requestId?: string): void {
    if (loading) {
      this.httpRequestCount++;
      
      if (this.httpRequestCount === 1) {
        this.loadingStartTime = Date.now();
        this.updateGlobalState(true);
        this.logger.debug('Loading global iniciado');
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
    this.logger.warn('Loading forzado a detenerse');
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