import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, timer } from 'rxjs';
import { map, distinctUntilChanged, debounceTime, shareReplay, startWith } from 'rxjs/operators';
import { 
  INavItemEnhanced, 
  UserRole 
} from '../../../shared/types/navigation.types';
import { NavigationUtils } from '../../../shared/utils/navigation.utils';

/**
 * Configuración de optimización de rendimiento
 */
export interface PerformanceConfig {
  // Lazy loading
  lazyLoadThreshold: number; // Número de elementos antes de activar lazy loading
  chunkSize: number; // Tamaño de chunks para lazy loading
  
  // Memoización
  permissionCacheSize: number; // Tamaño máximo del cache de permisos
  permissionCacheTTL: number; // TTL del cache en milisegundos
  
  // Badges
  badgeUpdateDebounce: number; // Debounce para actualizaciones de badges en ms
  badgeUpdateBatchSize: number; // Tamaño de lote para actualizaciones de badges
  
  // Renderizado
  virtualScrollThreshold: number; // Umbral para activar scroll virtual
  renderDebounce: number; // Debounce para renders en ms
}

/**
 * Entrada del cache de permisos
 */
interface PermissionCacheEntry {
  userRole: UserRole;
  itemId: string;
  hasPermission: boolean;
  timestamp: number;
  accessCount: number;
}

/**
 * Chunk de navegación para lazy loading
 */
export interface NavigationChunk {
  id: string;
  items: INavItemEnhanced[];
  priority: number;
  loaded: boolean;
  loading: boolean;
}

/**
 * Estadísticas de rendimiento
 */
export interface PerformanceStats {
  permissionCacheHits: number;
  permissionCacheMisses: number;
  lazyLoadedChunks: number;
  badgeUpdatesDebounced: number;
  averageRenderTime: number;
  memoryUsage: {
    cacheSize: number;
    chunksLoaded: number;
    totalItems: number;
  };
}

/**
 * Servicio de optimización de rendimiento para navegación
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationPerformanceService {
  
  private readonly defaultConfig: PerformanceConfig = {
    lazyLoadThreshold: 50,
    chunkSize: 10,
    permissionCacheSize: 1000,
    permissionCacheTTL: 300000, // 5 minutos
    badgeUpdateDebounce: 500,
    badgeUpdateBatchSize: 5,
    virtualScrollThreshold: 100,
    renderDebounce: 100
  };

  private config: PerformanceConfig = { ...this.defaultConfig };
  
  // Cache de permisos con LRU
  private permissionCache = new Map<string, PermissionCacheEntry>();
  private cacheAccessOrder: string[] = [];
  
  // Chunks de navegación para lazy loading
  private navigationChunks = new Map<string, NavigationChunk>();
  private chunksSubject = new BehaviorSubject<Map<string, NavigationChunk>>(new Map());
  
  // Estadísticas de rendimiento
  private stats: PerformanceStats = {
    permissionCacheHits: 0,
    permissionCacheMisses: 0,
    lazyLoadedChunks: 0,
    badgeUpdatesDebounced: 0,
    averageRenderTime: 0,
    memoryUsage: {
      cacheSize: 0,
      chunksLoaded: 0,
      totalItems: 0
    }
  };
  
  // Observables optimizados
  private memoizedPermissionChecks = new Map<string, Observable<boolean>>();
  private debouncedBadgeUpdates = new BehaviorSubject<Map<string, number>>(new Map());

  constructor() {
    this.initializePerformanceOptimizations();
  }

  /**
   * Configura las opciones de rendimiento
   */
  configurePerformance(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    this.cleanupCacheIfNeeded();
  }

  /**
   * Verifica permisos con memoización
   */
  checkPermissionMemoized(item: INavItemEnhanced, userRole: UserRole): boolean {
    const itemId = this.generateItemId(item);
    const cacheKey = `${userRole}-${itemId}`;
    
    // Verificar cache
    const cached = this.permissionCache.get(cacheKey);
    if (cached && this.isCacheEntryValid(cached)) {
      // Actualizar orden de acceso para LRU
      this.updateCacheAccess(cacheKey);
      this.stats.permissionCacheHits++;
      return cached.hasPermission;
    }

    // Calcular permiso
    this.stats.permissionCacheMisses++;
    const hasPermission = this.calculateItemPermission(item, userRole);
    
    // Guardar en cache
    this.setCacheEntry(cacheKey, {
      userRole,
      itemId,
      hasPermission,
      timestamp: Date.now(),
      accessCount: 1
    });

    return hasPermission;
  }

  /**
   * Crea chunks de navegación para lazy loading
   */
  createNavigationChunks(items: INavItemEnhanced[]): Observable<NavigationChunk[]> {
    if (items.length <= this.config.lazyLoadThreshold) {
      // No necesita lazy loading, devolver todo como un chunk
      const singleChunk: NavigationChunk = {
        id: 'main',
        items,
        priority: 100,
        loaded: true,
        loading: false
      };
      
      this.navigationChunks.set('main', singleChunk);
      this.chunksSubject.next(new Map(this.navigationChunks));
      
      return this.chunksSubject.asObservable().pipe(
        map(chunks => Array.from(chunks.values()))
      );
    }

    // Crear chunks basados en prioridad y agrupación lógica
    const chunks = this.createOptimalChunks(items);
    
    // Cargar el primer chunk inmediatamente
    if (chunks.length > 0) {
      chunks[0].loaded = true;
      this.navigationChunks.set(chunks[0].id, chunks[0]);
    }

    // Configurar lazy loading para el resto
    chunks.slice(1).forEach(chunk => {
      this.navigationChunks.set(chunk.id, chunk);
    });

    this.chunksSubject.next(new Map(this.navigationChunks));
    
    return this.chunksSubject.asObservable().pipe(
      map(chunks => Array.from(chunks.values()))
    );
  }

  /**
   * Carga un chunk específico de forma lazy
   */
  loadChunk(chunkId: string): Observable<NavigationChunk | null> {
    const chunk = this.navigationChunks.get(chunkId);
    
    if (!chunk) {
      return new BehaviorSubject(null).asObservable();
    }

    if (chunk.loaded) {
      return new BehaviorSubject(chunk).asObservable();
    }

    // Simular carga asíncrona (en una implementación real, esto podría ser una llamada HTTP)
    chunk.loading = true;
    this.navigationChunks.set(chunkId, chunk);
    this.chunksSubject.next(new Map(this.navigationChunks));

    return timer(100).pipe( // Simular latencia de carga
      map(() => {
        chunk.loaded = true;
        chunk.loading = false;
        this.stats.lazyLoadedChunks++;
        
        this.navigationChunks.set(chunkId, chunk);
        this.chunksSubject.next(new Map(this.navigationChunks));
        
        return chunk;
      }),
      shareReplay(1)
    );
  }

  /**
   * Optimiza actualizaciones de badges con debounce y batching
   */
  optimizeBadgeUpdates(badgeUpdates: Observable<Map<string, number>>): Observable<Map<string, number>> {
    return badgeUpdates.pipe(
      debounceTime(this.config.badgeUpdateDebounce),
      map(updates => {
        this.stats.badgeUpdatesDebounced++;
        
        // Procesar en lotes para evitar renders excesivos
        const batches = this.createBadgeUpdateBatches(updates);
        
        // Por ahora devolver todas las actualizaciones
        // En una implementación más avanzada, se procesarían los lotes secuencialmente
        return updates;
      }),
      distinctUntilChanged((prev, curr) => this.areBadgeMapsEqual(prev, curr)),
      shareReplay(1)
    );
  }

  /**
   * Obtiene elementos de navegación con optimizaciones aplicadas
   */
  getOptimizedNavigationItems(
    items: INavItemEnhanced[], 
    userRole: UserRole
  ): Observable<INavItemEnhanced[]> {
    const startTime = performance.now();
    
    return combineLatest([
      this.createNavigationChunks(items),
      timer(0, 1000).pipe(startWith(0)) // Trigger para actualizaciones periódicas
    ]).pipe(
      map(([chunks]) => {
        // Filtrar solo chunks cargados
        const loadedChunks = chunks.filter(chunk => chunk.loaded);
        
        // Combinar items de chunks cargados
        const allItems = loadedChunks.reduce((acc, chunk) => {
          return acc.concat(chunk.items);
        }, [] as INavItemEnhanced[]);

        // Aplicar filtrado de permisos memoizado
        const filteredItems = allItems.filter(item => 
          this.checkPermissionMemoized(item, userRole)
        );

        // Actualizar estadísticas de rendimiento
        const endTime = performance.now();
        this.updateRenderTime(endTime - startTime);
        this.updateMemoryStats();

        return filteredItems;
      }),
      debounceTime(this.config.renderDebounce),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  /**
   * Obtiene estadísticas de rendimiento
   */
  getPerformanceStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Limpia el cache de permisos
   */
  clearPermissionCache(): void {
    this.permissionCache.clear();
    this.cacheAccessOrder = [];
    this.stats.permissionCacheHits = 0;
    this.stats.permissionCacheMisses = 0;
  }

  /**
   * Optimiza el uso de memoria
   */
  optimizeMemoryUsage(): void {
    // Limpiar cache expirado
    this.cleanupExpiredCache();
    
    // Descargar chunks no utilizados recientemente
    this.unloadUnusedChunks();
    
    // Limpiar observables memoizados no utilizados
    this.cleanupMemoizedObservables();
    
    // Actualizar estadísticas
    this.updateMemoryStats();
  }

  /**
   * Inicializa las optimizaciones de rendimiento
   */
  private initializePerformanceOptimizations(): void {
    // Configurar limpieza automática del cache cada 5 minutos
    timer(0, 300000).subscribe(() => {
      this.optimizeMemoryUsage();
    });

    // Configurar monitoreo de rendimiento
    this.setupPerformanceMonitoring();
  }

  /**
   * Genera un ID único para un elemento
   */
  private generateItemId(item: INavItemEnhanced): string {
    if (item.url) {
      return Array.isArray(item.url) ? item.url.join('-') : item.url;
    }
    return item.name?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'unknown';
  }

  /**
   * Verifica si una entrada del cache es válida
   */
  private isCacheEntryValid(entry: PermissionCacheEntry): boolean {
    return (Date.now() - entry.timestamp) < this.config.permissionCacheTTL;
  }

  /**
   * Actualiza el acceso al cache para LRU
   */
  private updateCacheAccess(cacheKey: string): void {
    // Remover de la posición actual
    const index = this.cacheAccessOrder.indexOf(cacheKey);
    if (index > -1) {
      this.cacheAccessOrder.splice(index, 1);
    }
    
    // Agregar al final (más reciente)
    this.cacheAccessOrder.push(cacheKey);
    
    // Actualizar contador de acceso
    const entry = this.permissionCache.get(cacheKey);
    if (entry) {
      entry.accessCount++;
      this.permissionCache.set(cacheKey, entry);
    }
  }

  /**
   * Establece una entrada en el cache
   */
  private setCacheEntry(cacheKey: string, entry: PermissionCacheEntry): void {
    // Verificar si necesitamos limpiar el cache
    if (this.permissionCache.size >= this.config.permissionCacheSize) {
      this.evictLRUEntry();
    }

    this.permissionCache.set(cacheKey, entry);
    this.updateCacheAccess(cacheKey);
  }

  /**
   * Expulsa la entrada menos recientemente utilizada
   */
  private evictLRUEntry(): void {
    if (this.cacheAccessOrder.length > 0) {
      const lruKey = this.cacheAccessOrder.shift()!;
      this.permissionCache.delete(lruKey);
    }
  }

  /**
   * Limpia el cache si es necesario
   */
  private cleanupCacheIfNeeded(): void {
    if (this.permissionCache.size > this.config.permissionCacheSize) {
      // Mantener solo las entradas más recientes
      const keysToKeep = this.cacheAccessOrder.slice(-this.config.permissionCacheSize);
      const newCache = new Map<string, PermissionCacheEntry>();
      
      keysToKeep.forEach(key => {
        const entry = this.permissionCache.get(key);
        if (entry) {
          newCache.set(key, entry);
        }
      });
      
      this.permissionCache = newCache;
      this.cacheAccessOrder = keysToKeep;
    }
  }

  /**
   * Crea chunks óptimos basados en la estructura de navegación
   */
  private createOptimalChunks(items: INavItemEnhanced[]): NavigationChunk[] {
    const chunks: NavigationChunk[] = [];
    
    // Agrupar por secciones (elementos con title: true)
    let currentChunk: INavItemEnhanced[] = [];
    let chunkIndex = 0;
    
    for (const item of items) {
      if (item.title && currentChunk.length > 0) {
        // Crear chunk con los elementos acumulados
        chunks.push({
          id: `chunk-${chunkIndex}`,
          items: [...currentChunk],
          priority: this.calculateChunkPriority(currentChunk),
          loaded: false,
          loading: false
        });
        
        currentChunk = [];
        chunkIndex++;
      }
      
      currentChunk.push(item);
      
      // Si el chunk alcanza el tamaño máximo, crear un nuevo chunk
      if (currentChunk.length >= this.config.chunkSize) {
        chunks.push({
          id: `chunk-${chunkIndex}`,
          items: [...currentChunk],
          priority: this.calculateChunkPriority(currentChunk),
          loaded: false,
          loading: false
        });
        
        currentChunk = [];
        chunkIndex++;
      }
    }
    
    // Agregar el último chunk si tiene elementos
    if (currentChunk.length > 0) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        items: [...currentChunk],
        priority: this.calculateChunkPriority(currentChunk),
        loaded: false,
        loading: false
      });
    }
    
    // Ordenar chunks por prioridad
    return chunks.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calcula la prioridad de un chunk basada en sus elementos
   */
  private calculateChunkPriority(items: INavItemEnhanced[]): number {
    if (items.length === 0) return 0;
    
    const priorities = items
      .filter(item => item.priority !== undefined)
      .map(item => item.priority!);
    
    if (priorities.length === 0) return 50; // Prioridad por defecto
    
    // Usar la prioridad máxima del chunk
    return Math.max(...priorities);
  }

  /**
   * Crea lotes de actualizaciones de badges
   */
  private createBadgeUpdateBatches(updates: Map<string, number>): Map<string, number>[] {
    const batches: Map<string, number>[] = [];
    const entries = Array.from(updates.entries());
    
    for (let i = 0; i < entries.length; i += this.config.badgeUpdateBatchSize) {
      const batch = new Map(entries.slice(i, i + this.config.badgeUpdateBatchSize));
      batches.push(batch);
    }
    
    return batches;
  }

  /**
   * Compara dos mapas de badges para detectar cambios
   */
  private areBadgeMapsEqual(map1: Map<string, number>, map2: Map<string, number>): boolean {
    if (map1.size !== map2.size) return false;
    
    for (const [key, value] of map1) {
      if (map2.get(key) !== value) return false;
    }
    
    return true;
  }

  /**
   * Actualiza el tiempo promedio de renderizado
   */
  private updateRenderTime(renderTime: number): void {
    // Calcular promedio móvil simple
    this.stats.averageRenderTime = (this.stats.averageRenderTime + renderTime) / 2;
  }

  /**
   * Actualiza las estadísticas de memoria
   */
  private updateMemoryStats(): void {
    this.stats.memoryUsage = {
      cacheSize: this.permissionCache.size,
      chunksLoaded: Array.from(this.navigationChunks.values()).filter(c => c.loaded).length,
      totalItems: Array.from(this.navigationChunks.values()).reduce((sum, chunk) => sum + chunk.items.length, 0)
    };
  }

  /**
   * Limpia el cache expirado
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.permissionCache) {
      if ((now - entry.timestamp) > this.config.permissionCacheTTL) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.permissionCache.delete(key);
      const index = this.cacheAccessOrder.indexOf(key);
      if (index > -1) {
        this.cacheAccessOrder.splice(index, 1);
      }
    });
  }

  /**
   * Descarga chunks no utilizados recientemente
   */
  private unloadUnusedChunks(): void {
    const now = Date.now();
    const unloadThreshold = 600000; // 10 minutos
    
    for (const [chunkId, chunk] of this.navigationChunks) {
      // En una implementación real, se rastrearía el último acceso a cada chunk
      // Por ahora, mantener todos los chunks cargados
    }
  }

  /**
   * Limpia observables memoizados no utilizados
   */
  private cleanupMemoizedObservables(): void {
    // En una implementación real, se rastrearían los observables no utilizados
    // y se limpiarían para liberar memoria
    if (this.memoizedPermissionChecks.size > 100) {
      this.memoizedPermissionChecks.clear();
    }
  }

  /**
   * Configura el monitoreo de rendimiento
   */
  private setupPerformanceMonitoring(): void {
    // Monitorear el uso de memoria cada minuto
    timer(0, 60000).subscribe(() => {
      this.updateMemoryStats();
      
      // Log de estadísticas si el rendimiento se degrada
      if (this.stats.averageRenderTime > 100) { // > 100ms
        console.warn('[NavigationPerformanceService] Slow render detected:', {
          averageRenderTime: this.stats.averageRenderTime,
          cacheHitRate: this.stats.permissionCacheHits / (this.stats.permissionCacheHits + this.stats.permissionCacheMisses),
          memoryUsage: this.stats.memoryUsage
        });
      }
    });
  }

  /**
   * Calcula si un elemento tiene permisos para un rol específico
   */
  private calculateItemPermission(item: INavItemEnhanced, userRole: UserRole): boolean {
    // Si el item tiene roles requeridos específicos, verificar contra esos
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      return item.requiredRoles.includes(userRole);
    }
    
    // Si tiene un rol mínimo requerido, verificar jerarquía
    if (item.minRole) {
      return NavigationUtils.hasMinimumRole(userRole, item.minRole);
    }
    
    // Si no tiene restricciones específicas, permitir acceso
    return true;
  }
}