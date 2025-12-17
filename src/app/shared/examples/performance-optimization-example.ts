/**
 * Ejemplos de uso del sistema de optimización de rendimiento para navegación
 * 
 * Este archivo demuestra cómo utilizar las funcionalidades de optimización
 * implementadas en la Tarea 11 del proyecto de optimización del sidebar.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NavigationService } from '../../core/services/ui/navigation.service';
import { NavigationPerformanceService } from '../../core/services/ui/navigation-performance.service';
import { INavItemEnhanced, UserRole } from '../types/navigation.types';

@Injectable({
  providedIn: 'root'
})
export class PerformanceOptimizationExampleService {

  constructor(
    private navigationService: NavigationService,
    private performanceService: NavigationPerformanceService
  ) {}

  /**
   * Ejemplo 1: Configuración básica de optimizaciones de rendimiento
   */
  configureBasicPerformanceOptimizations(): void {
    this.navigationService.configurePerformanceOptions({
      lazyLoadThreshold: 25,        // Activar lazy loading con más de 25 elementos
      chunkSize: 8,                 // Chunks de 8 elementos
      permissionCacheSize: 300,     // Cache para 300 verificaciones
      permissionCacheTTL: 180000,   // 3 minutos de TTL
      badgeUpdateDebounce: 250,     // 250ms de debounce para badges
      badgeUpdateBatchSize: 8,      // Procesar badges en lotes de 8
      renderDebounce: 100           // 100ms de debounce para renders
    });
  }

  /**
   * Ejemplo 2: Configuración para aplicaciones con muchos usuarios
   */
  configureHighVolumeOptimizations(): void {
    this.navigationService.configurePerformanceOptions({
      lazyLoadThreshold: 15,        // Lazy loading más agresivo
      chunkSize: 5,                 // Chunks más pequeños
      permissionCacheSize: 1000,    // Cache más grande
      permissionCacheTTL: 600000,   // 10 minutos de TTL
      badgeUpdateDebounce: 500,     // Debounce más largo
      badgeUpdateBatchSize: 15,     // Lotes más grandes
      renderDebounce: 200           // Render debounce más conservador
    });
  }

  /**
   * Ejemplo 3: Configuración para dispositivos móviles
   */
  configureMobileOptimizations(): void {
    this.navigationService.configurePerformanceOptions({
      lazyLoadThreshold: 10,        // Lazy loading muy agresivo
      chunkSize: 3,                 // Chunks muy pequeños
      permissionCacheSize: 150,     // Cache reducido para memoria limitada
      permissionCacheTTL: 120000,   // 2 minutos de TTL
      badgeUpdateDebounce: 300,     // Debounce moderado
      badgeUpdateBatchSize: 3,      // Lotes pequeños
      renderDebounce: 150           // Render debounce moderado
    });
  }

  /**
   * Ejemplo 4: Obtener navegación optimizada con lazy loading
   */
  getOptimizedNavigation(userRole: UserRole): Observable<INavItemEnhanced[]> {
    // El servicio automáticamente aplicará todas las optimizaciones configuradas
    return this.navigationService.getNavigationItems(userRole);
  }

  /**
   * Ejemplo 5: Verificación de permisos con cache memoizado
   */
  checkPermissionWithCache(item: INavItemEnhanced, userRole: UserRole): boolean {
    // Usa cache automático para mejorar rendimiento
    return this.navigationService.checkPermissionMemoized(item, userRole);
  }

  /**
   * Ejemplo 6: Manejo manual de chunks para casos especiales
   */
  handleLazyLoadingManually(items: INavItemEnhanced[]): Observable<any[]> {
    // Crear chunks manualmente si necesitas control específico
    return this.navigationService.createNavigationChunks(items);
  }

  /**
   * Ejemplo 7: Cargar un chunk específico bajo demanda
   */
  loadSpecificChunk(chunkId: string): Observable<any> {
    return this.navigationService.loadNavigationChunk(chunkId);
  }

  /**
   * Ejemplo 8: Monitoreo de rendimiento en tiempo real
   */
  monitorPerformance(): void {
    // Obtener estadísticas cada 30 segundos
    setInterval(() => {
      const stats = this.navigationService.getPerformanceStatistics();
      
      console.log('Performance Stats:', {
        cacheHitRate: stats.cacheEfficiency.hitRate,
        averageRenderTime: stats.performance.averageRenderTime,
        memoryUsage: stats.performance.memoryUsage,
        serviceHealth: stats.health
      });

      // Alertar si el rendimiento se degrada
      if (stats.cacheEfficiency.hitRate < 0.7) {
        console.warn('Cache hit rate is low:', stats.cacheEfficiency.hitRate);
      }

      if (stats.performance.averageRenderTime > 150) {
        console.warn('Render time is high:', stats.performance.averageRenderTime);
      }
    }, 30000);
  }

  /**
   * Ejemplo 9: Optimización manual cuando sea necesario
   */
  performManualOptimization(): void {
    // Limpiar cache si está muy lleno
    const stats = this.navigationService.getPerformanceStatistics();
    
    if (stats.performance.memoryUsage.cacheSize > 800) {
      this.navigationService.clearPermissionCache();
      console.log('Permission cache cleared due to high memory usage');
    }

    // Optimizar memoria general
    this.navigationService.optimizePerformance();
  }

  /**
   * Ejemplo 10: Configuración adaptativa basada en el dispositivo
   */
  configureAdaptivePerformance(): void {
    // Detectar capacidades del dispositivo
    const isLowEndDevice = this.detectLowEndDevice();
    const isMobile = window.innerWidth < 768;
    
    if (isLowEndDevice || isMobile) {
      this.configureMobileOptimizations();
    } else if (this.isHighEndDevice()) {
      this.configureHighVolumeOptimizations();
    } else {
      this.configureBasicPerformanceOptimizations();
    }
  }

  /**
   * Ejemplo 11: Manejo de errores de rendimiento
   */
  handlePerformanceErrors(): void {
    const stats = this.navigationService.getPerformanceStatistics();
    
    // Verificar salud del servicio
    if (!stats.health.healthy) {
      console.error('Navigation service is unhealthy:', stats.health);
      
      // Intentar recuperación automática
      this.navigationService.optimizePerformance();
      
      // Si sigue fallando, usar configuración conservadora
      setTimeout(() => {
        const newStats = this.navigationService.getPerformanceStatistics();
        if (!newStats.health.healthy) {
          this.configureMobileOptimizations(); // Configuración más conservadora
        }
      }, 5000);
    }
  }

  /**
   * Ejemplo 12: Benchmarking de rendimiento
   */
  benchmarkPerformance(items: INavItemEnhanced[], userRole: UserRole): Promise<any> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      this.navigationService.getNavigationItems(userRole).subscribe(result => {
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        const benchmark = {
          processingTime,
          itemCount: items.length,
          resultCount: result.length,
          itemsPerMs: result.length / processingTime,
          performanceStats: this.navigationService.getPerformanceStatistics()
        };
        
        console.log('Performance Benchmark:', benchmark);
        resolve(benchmark);
      });
    });
  }

  // Métodos auxiliares

  private detectLowEndDevice(): boolean {
    // Heurística simple para detectar dispositivos de gama baja
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    
    return memory && memory < 4 || cores && cores < 4;
  }

  private isHighEndDevice(): boolean {
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    
    return memory && memory >= 8 && cores && cores >= 8;
  }
}

/**
 * Ejemplo de uso en un componente Angular
 */
/*
@Component({
  selector: 'app-optimized-navigation',
  template: `
    <div class="navigation-container">
      <div *ngFor="let item of navigationItems$ | async" class="nav-item">
        {{ item.name }}
      </div>
    </div>
  `
})
export class OptimizedNavigationComponent implements OnInit {
  navigationItems$: Observable<INavItemEnhanced[]>;

  constructor(
    private exampleService: PerformanceOptimizationExampleService,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    // Configurar optimizaciones
    this.exampleService.configureAdaptivePerformance();
    
    // Obtener navegación optimizada
    this.navigationItems$ = this.exampleService.getOptimizedNavigation(UserRole.ADMINISTRADOR);
    
    // Iniciar monitoreo
    this.exampleService.monitorPerformance();
  }
}
*/

/**
 * Configuraciones recomendadas por tipo de aplicación:
 * 
 * 1. Aplicación pequeña (< 20 elementos de navegación):
 *    - lazyLoadThreshold: 50 (desactivado efectivamente)
 *    - permissionCacheSize: 100
 *    - badgeUpdateDebounce: 200
 * 
 * 2. Aplicación mediana (20-100 elementos):
 *    - lazyLoadThreshold: 30
 *    - chunkSize: 8
 *    - permissionCacheSize: 300
 *    - badgeUpdateDebounce: 300
 * 
 * 3. Aplicación grande (> 100 elementos):
 *    - lazyLoadThreshold: 15
 *    - chunkSize: 5
 *    - permissionCacheSize: 1000
 *    - badgeUpdateDebounce: 500
 * 
 * 4. Aplicación móvil:
 *    - lazyLoadThreshold: 10
 *    - chunkSize: 3
 *    - permissionCacheSize: 150
 *    - badgeUpdateDebounce: 300
 */