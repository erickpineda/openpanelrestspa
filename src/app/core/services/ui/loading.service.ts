import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { LoggerService } from '../logger.service';

export interface LoadingState {
  global: boolean;
  local: { [key: string]: boolean };
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Estado completo del loading
  private stateSubject = new BehaviorSubject<LoadingState>({
    global: false,
    local: {}
  });
  
  public state$ = this.stateSubject.asObservable();
  
  // Observables separados para diferentes usos
  public globalLoading$: Observable<boolean> = this.state$.pipe(
    map((state: { global: any; }) => state.global),
    distinctUntilChanged()
  );
  
  // Contador para peticiones HTTP globales
  private httpRequestCount = 0;
  private minimumDisplayTime = 500;
  private loadingStartTime = 0;

  constructor(private logger: LoggerService) {}

  // ===== MÉTODOS PARA LOADING GLOBAL (HTTP) =====
  
  setGlobalLoading(loading: boolean): void {
    if (loading) {
      this.httpRequestCount++;
      if (this.httpRequestCount === 1) {
        this.loadingStartTime = Date.now();
        this.updateGlobalState(true);
        this.logger.debug('Loading global iniciado');
      }
    } else {
      this.httpRequestCount = Math.max(0, this.httpRequestCount - 1);
      
      if (this.httpRequestCount === 0) {
        const elapsed = Date.now() - this.loadingStartTime;
        const remaining = Math.max(0, this.minimumDisplayTime - elapsed);
        
        setTimeout(() => {
          // Verificar que no hayan llegado nuevas peticiones durante la espera
          if (this.httpRequestCount === 0) {
            this.updateGlobalState(false);
            this.logger.debug('Loading global finalizado');
          }
        }, remaining);
      }
    }
  }

  // ===== MÉTODOS PARA LOADING LOCAL (COMPONENTES) =====
  
  setLocalLoading(key: string, loading: boolean): void {
    const currentState = this.stateSubject.value;
    const newLocalState = { ...currentState.local };
    
    if (loading) {
      newLocalState[key] = true;
    } else {
      delete newLocalState[key];
    }
    
    this.stateSubject.next({
      ...currentState,
      local: newLocalState
    });
    
    this.logger.debug(`Loading local ${key}: ${loading}`);
  }

  getLocalLoading(key: string): boolean {
    return this.stateSubject.value.local[key] || false;
  }

  isAnyLocalLoading(): boolean {
    return Object.keys(this.stateSubject.value.local).length > 0;
  }

  // ===== MÉTODOS ÚTILES =====
  
  isLoading(): boolean {
    const state = this.stateSubject.value;
    return state.global || this.isAnyLocalLoading();
  }

  reset(): void {
    this.httpRequestCount = 0;
    this.stateSubject.next({
      global: false,
      local: {}
    });
    this.logger.debug('Loading resetado completamente');
  }

  // ===== MÉTODOS PRIVADOS =====
  
  private updateGlobalState(global: boolean): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      global
    });
  }
}