import { Injectable, OnDestroy } from '@angular/core';
import {
  Observable,
  BehaviorSubject,
  Subscription,
  timer,
  combineLatest,
  of,
  merge,
  EMPTY,
  throwError,
} from 'rxjs';
import {
  map,
  switchMap,
  catchError,
  startWith,
  retry,
  retryWhen,
  delay,
  take,
  filter,
  distinctUntilChanged,
} from 'rxjs/operators';

import { IBadgeCounterService } from '../../../shared/types/navigation.types';
import { NavigationConstants } from '../../../shared/constants/navigation.constants';

// Importar servicios de datos existentes
import { ComentarioService } from '../data/comentario.service';
import { EntradaService } from '../data/entrada.service';
import { UsuarioService } from '../data/usuario.service';

import { TemporaryStorageService } from './temporary-storage.service';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';

/**
 * Códigos de error específicos para el servicio de contadores
 */
export enum BadgeCounterErrorCodes {
  SERVICE_UNAVAILABLE = 'BADGE_001',
  INVALID_COUNTER_ID = 'BADGE_002',
  NETWORK_ERROR = 'BADGE_003',
  PERMISSION_DENIED = 'BADGE_004',
  CONFIGURATION_ERROR = 'BADGE_005',
}

/**
 * Configuración de fallbacks para contadores
 */
export interface CounterFallbackConfig {
  defaultValue: number;
  maxRetries: number;
  retryDelayMs: number;
  enableLogging: boolean;
}

/**
 * Servicio para manejo de contadores dinámicos en badges de navegación
 * con manejo robusto de errores y fallbacks
 */
@Injectable({
  providedIn: 'root',
})
export class BadgeCounterService implements IBadgeCounterService, OnDestroy {
  private readonly countersSubject = new BehaviorSubject<Map<string, number>>(new Map());
  private refreshTimers: Map<string, Subscription> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private fallbackConfig: CounterFallbackConfig = {
    defaultValue: 0,
    maxRetries: 3,
    retryDelayMs: 2000,
    enableLogging: true,
  };

  constructor(
    private comentarioService: ComentarioService,
    private entradaService: EntradaService,
    private usuarioService: UsuarioService,
    private temporaryStorage: TemporaryStorageService
  ) {
    const isTestEnv =
      typeof (globalThis as any).__karma__ !== 'undefined' ||
      typeof (globalThis as any).jasmine !== 'undefined';
    const allowInTest = (globalThis as any).__ENABLE_BADGE_COUNTERS_IN_TEST__ === true;
    if (!isTestEnv || allowInTest) {
      this.initializeCounters();
    }
  }

  /**
   * Obtiene el contador de comentarios sin moderar con manejo robusto de errores
   */
  getUnmoderatedCommentsCount(): Observable<number> {
    return this.comentarioService.listarSafeSinGlobalLoader().pipe(
      map((comentarios: any[]) => {
        if (!Array.isArray(comentarios)) {
          this.logError(
            'unmoderated-comments',
            BadgeCounterErrorCodes.INVALID_COUNTER_ID,
            'Invalid response format for comments'
          );
          return this.fallbackConfig.defaultValue;
        }

        // Filtrar comentarios que requieren moderación
        return comentarios.filter(
          (comentario: any) =>
            comentario.estado === 'PENDIENTE' || comentario.estado === 'REPORTADO'
        ).length;
      }),
      retry({
        count: this.fallbackConfig.maxRetries,
        delay: this.fallbackConfig.retryDelayMs,
      }),
      catchError((error) => {
        this.logError('unmoderated-comments', BadgeCounterErrorCodes.SERVICE_UNAVAILABLE, error);
        return of(this.getFallbackValue('unmoderated-comments'));
      }),
      startWith(0)
    );
  }

  /**
   * Obtiene el contador de entradas en borrador con manejo robusto de errores
   */
  getDraftEntriesCount(): Observable<number> {
    const compute = () => {
      try {
        const entries: any = (this.temporaryStorage as any)?.getTemporaryEntriesByType?.('entrada') ?? [];
        return Array.isArray(entries) ? entries.length : 0;
      } catch {
        return 0;
      }
    };

    const initial = compute();
    const changes$: any = (this.temporaryStorage as any)?.entriesChanged$;
    const updates: Observable<number> =
      changes$ && typeof changes$.pipe === 'function' ? changes$.pipe(map(() => compute())) : EMPTY;

    return merge(of(initial), updates).pipe(
      distinctUntilChanged(),
      catchError((error) => {
        this.logError('draft-entries', BadgeCounterErrorCodes.SERVICE_UNAVAILABLE, error);
        return of(this.getFallbackValue('draft-entries'));
      })
    );
  }

  /**
   * Obtiene el contador de usuarios pendientes de aprobación con manejo robusto de errores
   */
  getPendingUsersCount(): Observable<number> {
    const fn: any = (this.usuarioService as any)?.listarSafeSinGlobalLoader;
    if (typeof fn !== 'function') {
      return of(this.getFallbackValue('pending-users')).pipe(startWith(0));
    }

    const obs: any = fn.call(this.usuarioService);
    if (!obs || typeof obs.pipe !== 'function') {
      return of(this.getFallbackValue('pending-users')).pipe(startWith(0));
    }

    return obs.pipe(
      map((usuarios: any[]) => {
        if (!Array.isArray(usuarios)) {
          this.logError(
            'pending-users',
            BadgeCounterErrorCodes.INVALID_COUNTER_ID,
            'Invalid response format for users'
          );
          return this.fallbackConfig.defaultValue;
        }

        // Filtrar usuarios pendientes de activación
        return usuarios.filter(
          (usuario: any) => usuario.estado === 'PENDIENTE' || usuario.estado === 'INACTIVO'
        ).length;
      }),
      retry({
        count: this.fallbackConfig.maxRetries,
        delay: this.fallbackConfig.retryDelayMs,
      }),
      catchError((error) => {
        this.logError('pending-users', BadgeCounterErrorCodes.SERVICE_UNAVAILABLE, error);
        return of(this.getFallbackValue('pending-users'));
      }),
      startWith(0)
    );
  }

  /**
   * Obtiene el contador de borradores del usuario actual
   */
  getMyDraftsCount(): Observable<number> {
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.usuarioService.obtenerDatosSesionActualSafe(context).pipe(
      switchMap((perfil: any) => {
        if (!perfil || !perfil.username) {
          return of(0);
        }
        return this.entradaService.listarSafeSinGlobalLoader().pipe(
          map((entradas: any[]) => {
            if (!Array.isArray(entradas)) {
              return 0;
            }
            return entradas.filter(
              (entrada: any) =>
                (entrada.autor?.username === perfil.username ||
                  entrada.usuarioNombre === perfil.username) &&
                (entrada.estado === 'BORRADOR' || entrada.estado === 'TEMPORAL')
            ).length;
          })
        );
      }),
      retry({
        count: this.fallbackConfig.maxRetries,
        delay: this.fallbackConfig.retryDelayMs,
      }),
      catchError((error) => {
        this.logError('my-drafts', BadgeCounterErrorCodes.SERVICE_UNAVAILABLE, error);
        return of(this.getFallbackValue('my-drafts'));
      }),
      startWith(0)
    );
  }

  /**
   * Obtiene el contador de alertas del sistema con manejo robusto de errores
   */
  getSystemAlertsCount(): Observable<number> {
    // Combinar diferentes fuentes de alertas del sistema
    return combineLatest([
      this.getUnmoderatedCommentsCount(),
      this.getDraftEntriesCount(),
      this.getPendingUsersCount(),
    ]).pipe(
      map(([comments, drafts, users]) => {
        // Validar que todos los valores sean números válidos
        const validComments = typeof comments === 'number' && !isNaN(comments) ? comments : 0;
        const validDrafts = typeof drafts === 'number' && !isNaN(drafts) ? drafts : 0;
        const validUsers = typeof users === 'number' && !isNaN(users) ? users : 0;

        // Calcular alertas críticas del sistema
        let alerts = 0;

        // Comentarios críticos (más de 10 sin moderar)
        if (validComments > 10) alerts++;

        // Borradores antiguos (más de 20)
        if (validDrafts > 20) alerts++;

        // Usuarios pendientes críticos (más de 5)
        if (validUsers > 5) alerts++;

        return alerts;
      }),
      catchError((error) => {
        this.logError('system-alerts', BadgeCounterErrorCodes.SERVICE_UNAVAILABLE, error);
        return of(this.getFallbackValue('system-alerts'));
      })
    );
  }

  /**
   * Refresca todos los contadores manualmente
   */
  refreshAllCounters(): void {
    this.updateCounter('unmoderated-comments', this.getUnmoderatedCommentsCount());
    this.updateCounter('draft-entries', this.getDraftEntriesCount());
    this.updateCounter('pending-users', this.getPendingUsersCount());
    this.updateCounter('system-alerts', this.getSystemAlertsCount());
    this.updateCounter('my-drafts', this.getMyDraftsCount());
  }

  /**
   * Obtiene un contador específico por ID
   */
  getCounterById(counterId: string): Observable<number> {
    return this.countersSubject.asObservable().pipe(
      map((counters) => {
        const current = counters.get(counterId);
        if (counterId === 'draft-entries') {
          try {
            const entries: any = (this.temporaryStorage as any)?.getTemporaryEntriesByType?.('entrada') ?? [];
            const len = Array.isArray(entries) ? entries.length : 0;
            return len;
          } catch {
            return current;
          }
        }
        return current;
      }),
      filter((v): v is number => typeof v === 'number')
    );
  }

  /**
   * Obtiene todos los contadores actuales
   */
  getAllCounters(): Observable<Map<string, number>> {
    return this.countersSubject.asObservable();
  }

  /**
   * Configura un contador con actualización automática
   */
  setupAutoRefreshCounter(
    counterId: string,
    counterObservable: Observable<number>,
    intervalMs: number = NavigationConstants.REFRESH_INTERVALS.TOO_SLOW
  ): void {
    this.stopAutoRefresh(counterId);

    this.updateCounter(counterId, counterObservable);

    const subscription = timer(0, intervalMs)
      .pipe(
        switchMap(() => counterObservable)
      )
      .subscribe((count) => {
        this.setCounterValue(counterId, count);
      });

    this.refreshTimers.set(counterId, subscription);
  }

  /**
   * Detiene la actualización automática de un contador
   */
  stopAutoRefresh(counterId: string): void {
    const existing = this.refreshTimers.get(counterId);
    if (existing) {
      existing.unsubscribe();
    }
    this.refreshTimers.delete(counterId);
  }

  ngOnDestroy(): void {
    for (const subscription of this.refreshTimers.values()) {
      subscription.unsubscribe();
    }
    this.refreshTimers.clear();
  }

  /**
   * Establece manualmente el valor de un contador
   */
  setCounterValue(counterId: string, value: number): void {
    const currentCounters = this.countersSubject.value;
    const newCounters = new Map(currentCounters);
    newCounters.set(counterId, value);
    this.countersSubject.next(newCounters);
  }

  /**
   * Incrementa un contador en una cantidad específica
   */
  incrementCounter(counterId: string, increment: number = 1): void {
    const currentValue = this.countersSubject.value.get(counterId) || 0;
    this.setCounterValue(counterId, currentValue + increment);
  }

  /**
   * Decrementa un contador en una cantidad específica
   */
  decrementCounter(counterId: string, decrement: number = 1): void {
    const currentValue = this.countersSubject.value.get(counterId) || 0;
    const newValue = Math.max(0, currentValue - decrement);
    this.setCounterValue(counterId, newValue);
  }

  /**
   * Resetea un contador a cero
   */
  resetCounter(counterId: string): void {
    this.setCounterValue(counterId, 0);
  }

  /**
   * Inicializa los contadores con configuración automática
   */
  initializeCounters(): void {
    // Configurar contadores con actualización automática
    this.setupAutoRefreshCounter(
      'unmoderated-comments',
      this.getUnmoderatedCommentsCount(),
      NavigationConstants.REFRESH_INTERVALS.TOO_SLOW
    );

    this.setupAutoRefreshCounter(
      'draft-entries',
      this.getDraftEntriesCount(),
      NavigationConstants.REFRESH_INTERVALS.TOO_SLOW
    );

    try {
      const fn: any = (this.temporaryStorage as any)?.getTemporaryEntriesByType;
      if (typeof fn === 'function') {
        const entries: any = fn.call(this.temporaryStorage, 'entrada') ?? [];
        this.setCounterValue('draft-entries', Array.isArray(entries) ? entries.length : 0);
      }
    } catch {}

    this.setupAutoRefreshCounter(
      'pending-users',
      this.getPendingUsersCount(),
      NavigationConstants.REFRESH_INTERVALS.TOO_SLOW
    );

    this.setupAutoRefreshCounter(
      'system-alerts',
      this.getSystemAlertsCount(),
      NavigationConstants.REFRESH_INTERVALS.TOO_SLOW
    );

    this.setupAutoRefreshCounter(
      'my-drafts',
      this.getMyDraftsCount(),
      NavigationConstants.REFRESH_INTERVALS.TOO_SLOW
    );
  }

  /**
   * Actualiza un contador específico con manejo de errores
   */
  private updateCounter(counterId: string, counterObservable: Observable<number>): void {
    counterObservable.subscribe({
      next: (count) => {
        this.setCounterValue(counterId, count);
        // Resetear contador de errores en caso de éxito
        this.errorCounts.delete(counterId);
      },
      error: (error) => {
        this.logError(counterId, BadgeCounterErrorCodes.SERVICE_UNAVAILABLE, error);
        this.setCounterValue(counterId, this.getFallbackValue(counterId));
      },
    });
  }

  /**
   * Registra errores del servicio de contadores
   */
  private logError(counterId: string, errorCode: BadgeCounterErrorCodes, error: any): void {
    if (!this.fallbackConfig.enableLogging) return;

    // Incrementar contador de errores
    const currentErrors = this.errorCounts.get(counterId) || 0;
    this.errorCounts.set(counterId, currentErrors + 1);

    const errorInfo = {
      timestamp: new Date().toISOString(),
      counterId,
      errorCode,
      errorCount: currentErrors + 1,
      error: error?.message || error,
    };

    console.error('[BadgeCounterService] Error:', errorInfo);

    // Emitir evento personalizado para sistemas de logging externos
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('badge-counter-error', {
          detail: errorInfo,
        })
      );
    }
  }

  /**
   * Obtiene el valor de fallback para un contador específico
   */
  private getFallbackValue(counterId: string): number {
    // Valores de fallback específicos por tipo de contador
    const fallbackValues: { [key: string]: number } = {
      'unmoderated-comments': 0,
      'draft-entries': 0,
      'pending-users': 0,
      'system-alerts': 0,
      'my-drafts': 0,
    };

    return fallbackValues[counterId] ?? this.fallbackConfig.defaultValue;
  }

  /**
   * Configura los parámetros de fallback
   */
  public configureFallbacks(config: Partial<CounterFallbackConfig>): void {
    this.fallbackConfig = { ...this.fallbackConfig, ...config };
  }

  /**
   * Obtiene estadísticas de errores por contador
   */
  public getErrorStatistics(): Map<string, number> {
    return new Map(this.errorCounts);
  }

  /**
   * Resetea las estadísticas de errores
   */
  public resetErrorStatistics(): void {
    this.errorCounts.clear();
  }

  /**
   * Verifica si un contador está en estado de error
   */
  public isCounterInErrorState(counterId: string): boolean {
    const errorCount = this.errorCounts.get(counterId) || 0;
    return errorCount >= this.fallbackConfig.maxRetries;
  }

  /**
   * Obtiene el estado de salud del servicio
   */
  public getServiceHealthStatus(): {
    healthy: boolean;
    errors: number;
    counters: number;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const totalCounters = this.countersSubject.value.size;
    const errorCounters = this.errorCounts.size;

    return {
      healthy: errorCounters === 0,
      errors: totalErrors,
      counters: totalCounters,
    };
  }
}
