import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, timer, combineLatest, of, throwError } from 'rxjs';
import { map, switchMap, catchError, startWith, retry, retryWhen, delay, take } from 'rxjs/operators';
import { 
  IBadgeCounterService 
} from '../../../shared/types/navigation.types';
import { NavigationConstants } from '../../../shared/constants/navigation.constants';

// Importar servicios de datos existentes
import { ComentarioService } from '../data/comentario.service';
import { EntradaService } from '../data/entrada.service';
import { UsuarioService } from '../data/usuario.service';

/**
 * Códigos de error específicos para el servicio de contadores
 */
export enum BadgeCounterErrorCodes {
  SERVICE_UNAVAILABLE = 'BADGE_001',
  INVALID_COUNTER_ID = 'BADGE_002',
  NETWORK_ERROR = 'BADGE_003',
  PERMISSION_DENIED = 'BADGE_004',
  CONFIGURATION_ERROR = 'BADGE_005'
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
  providedIn: 'root'
})
export class BadgeCounterService implements IBadgeCounterService {
  
  private readonly countersSubject = new BehaviorSubject<Map<string, number>>(new Map());
  private refreshTimers: Map<string, Observable<number>> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private fallbackConfig: CounterFallbackConfig = {
    defaultValue: 0,
    maxRetries: 3,
    retryDelayMs: 2000,
    enableLogging: true
  };

  constructor(
    private comentarioService: ComentarioService,
    private entradaService: EntradaService,
    private usuarioService: UsuarioService
  ) {
    // Inicializar contadores solo si no estamos en un entorno de pruebas
    if (typeof jasmine === 'undefined') {
      this.initializeCounters();
    }
  }

  /**
   * Obtiene el contador de comentarios sin moderar con manejo robusto de errores
   */
  getUnmoderatedCommentsCount(): Observable<number> {
    return this.comentarioService.listarSafe().pipe(
      map((comentarios: any[]) => {
        if (!Array.isArray(comentarios)) {
          this.logError('unmoderated-comments', BadgeCounterErrorCodes.INVALID_COUNTER_ID, 
            'Invalid response format for comments');
          return this.fallbackConfig.defaultValue;
        }
        
        // Filtrar comentarios que requieren moderación
        return comentarios.filter((comentario: any) => 
          comentario.estado === 'PENDIENTE' || comentario.estado === 'REPORTADO'
        ).length;
      }),
      retry({
        count: this.fallbackConfig.maxRetries,
        delay: this.fallbackConfig.retryDelayMs
      }),
      catchError(error => {
        this.logError('unmoderated-comments', BadgeCounterErrorCodes.SERVICE_UNAVAILABLE, error);
        return of(this.getFallbackValue('unmoderated-comments'));
      })
    );
  }

  /**
   * Obtiene el contador de entradas en borrador con manejo robusto de errores
   */
  getDraftEntriesCount(): Observable<number> {
    return this.entradaService.listarSafe().pipe(
      map((entradas: any[]) => {
        if (!Array.isArray(entradas)) {
          this.logError('draft-entries', BadgeCounterErrorCodes.INVALID_COUNTER_ID, 
            'Invalid response format for entries');
          return this.fallbackConfig.defaultValue;
        }
        
        // Filtrar entradas en estado borrador
        return entradas.filter((entrada: any) => 
          entrada.estado === 'BORRADOR' || entrada.estado === 'TEMPORAL'
        ).length;
      }),
      retry({
        count: this.fallbackConfig.maxRetries,
        delay: this.fallbackConfig.retryDelayMs
      }),
      catchError(error => {
        this.logError('draft-entries', BadgeCounterErrorCodes.SERVICE_UNAVAILABLE, error);
        return of(this.getFallbackValue('draft-entries'));
      })
    );
  }

  /**
   * Obtiene el contador de usuarios pendientes de aprobación con manejo robusto de errores
   */
  getPendingUsersCount(): Observable<number> {
    return this.usuarioService.listarSafe().pipe(
      map((usuarios: any[]) => {
        if (!Array.isArray(usuarios)) {
          this.logError('pending-users', BadgeCounterErrorCodes.INVALID_COUNTER_ID, 
            'Invalid response format for users');
          return this.fallbackConfig.defaultValue;
        }
        
        // Filtrar usuarios pendientes de activación
        return usuarios.filter((usuario: any) => 
          usuario.estado === 'PENDIENTE' || usuario.estado === 'INACTIVO'
        ).length;
      }),
      retry({
        count: this.fallbackConfig.maxRetries,
        delay: this.fallbackConfig.retryDelayMs
      }),
      catchError(error => {
        this.logError('pending-users', BadgeCounterErrorCodes.SERVICE_UNAVAILABLE, error);
        return of(this.getFallbackValue('pending-users'));
      })
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
      this.getPendingUsersCount()
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
      catchError(error => {
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
  }

  /**
   * Obtiene un contador específico por ID
   */
  getCounterById(counterId: string): Observable<number> {
    return this.countersSubject.asObservable().pipe(
      map(counters => counters.get(counterId) || 0)
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
    intervalMs: number = NavigationConstants.REFRESH_INTERVALS.NORMAL
  ): void {
    // Crear timer para actualización automática
    const refreshTimer = timer(0, intervalMs).pipe(
      switchMap(() => counterObservable),
      startWith(0)
    );

    this.refreshTimers.set(counterId, refreshTimer);
    
    // Suscribirse y actualizar el contador
    refreshTimer.subscribe(count => {
      this.setCounterValue(counterId, count);
    });
  }

  /**
   * Detiene la actualización automática de un contador
   */
  stopAutoRefresh(counterId: string): void {
    this.refreshTimers.delete(counterId);
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
      NavigationConstants.REFRESH_INTERVALS.NORMAL
    );

    this.setupAutoRefreshCounter(
      'draft-entries',
      this.getDraftEntriesCount(),
      NavigationConstants.REFRESH_INTERVALS.SLOW
    );

    this.setupAutoRefreshCounter(
      'pending-users',
      this.getPendingUsersCount(),
      NavigationConstants.REFRESH_INTERVALS.SLOW
    );

    this.setupAutoRefreshCounter(
      'system-alerts',
      this.getSystemAlertsCount(),
      NavigationConstants.REFRESH_INTERVALS.FAST
    );
  }

  /**
   * Actualiza un contador específico con manejo de errores
   */
  private updateCounter(counterId: string, counterObservable: Observable<number>): void {
    counterObservable.subscribe({
      next: count => {
        this.setCounterValue(counterId, count);
        // Resetear contador de errores en caso de éxito
        this.errorCounts.delete(counterId);
      },
      error: error => {
        this.logError(counterId, BadgeCounterErrorCodes.SERVICE_UNAVAILABLE, error);
        this.setCounterValue(counterId, this.getFallbackValue(counterId));
      }
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
      error: error?.message || error
    };

    console.error('[BadgeCounterService] Error:', errorInfo);

    // Emitir evento personalizado para sistemas de logging externos
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('badge-counter-error', { 
        detail: errorInfo 
      }));
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
      'system-alerts': 0
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
  public getServiceHealthStatus(): { healthy: boolean; errors: number; counters: number } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const totalCounters = this.countersSubject.value.size;
    const errorCounters = this.errorCounts.size;

    return {
      healthy: errorCounters === 0,
      errors: totalErrors,
      counters: totalCounters
    };
  }
}
