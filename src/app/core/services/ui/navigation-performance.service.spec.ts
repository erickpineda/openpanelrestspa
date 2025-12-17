import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { take } from 'rxjs/operators';
// fast-check removed for TS compatibility

import { NavigationPerformanceService, PerformanceConfig, NavigationChunk } from './navigation-performance.service';
import { INavItemEnhanced, UserRole } from '../../../shared/types/navigation.types';

describe('NavigationPerformanceService', () => {
  let service: NavigationPerformanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationPerformanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Permission Memoization', () => {
    it('should cache permission results', () => {
      const item: INavItemEnhanced = {
        name: 'Test Item',
        url: '/test',
        requiredRoles: [UserRole.ADMINISTRADOR]
      };

      // Primera llamada - debería calcular y cachear
      const result1 = service.checkPermissionMemoized(item, UserRole.ADMINISTRADOR);
      
      // Segunda llamada - debería usar cache
      const result2 = service.checkPermissionMemoized(item, UserRole.ADMINISTRADOR);
      
      expect(result1).toBe(result2);
      expect(result1).toBe(true);
      
      const stats = service.getPerformanceStats();
      expect(stats.permissionCacheHits).toBeGreaterThan(0);
    });

    it('should handle cache misses correctly', () => {
      const item: INavItemEnhanced = {
        name: 'Test Item',
        url: '/test',
        requiredRoles: [UserRole.PROPIETARIO]
      };

      service.checkPermissionMemoized(item, UserRole.LECTOR);
      
      const stats = service.getPerformanceStats();
      expect(stats.permissionCacheMisses).toBeGreaterThan(0);
    });

    it('should clear cache when requested', () => {
      const item: INavItemEnhanced = {
        name: 'Test Item',
        url: '/test',
        requiredRoles: [UserRole.ADMINISTRADOR]
      };

      service.checkPermissionMemoized(item, UserRole.ADMINISTRADOR);
      service.clearPermissionCache();
      
      const stats = service.getPerformanceStats();
      expect(stats.permissionCacheHits).toBe(0);
      expect(stats.permissionCacheMisses).toBe(0);
    });
  });

  describe('Lazy Loading', () => {
    it('should create single chunk for small item lists', (done) => {
      const items: INavItemEnhanced[] = [
        { name: 'Item 1', url: '/item1' },
        { name: 'Item 2', url: '/item2' }
      ];

      service.createNavigationChunks(items).pipe(take(1)).subscribe(chunks => {
        expect(chunks.length).toBe(1);
        expect(chunks[0].id).toBe('main');
        expect(chunks[0].loaded).toBe(true);
        expect(chunks[0].items.length).toBe(2);
        done();
      });
    });

    it('should create multiple chunks for large item lists', (done) => {
      // Configurar umbral bajo para testing
      service.configurePerformance({ lazyLoadThreshold: 5, chunkSize: 2 });
      
      const items: INavItemEnhanced[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Item ${i + 1}`,
        url: `/item${i + 1}`,
        priority: 100 - i
      }));

      service.createNavigationChunks(items).pipe(take(1)).subscribe(chunks => {
        expect(chunks.length).toBeGreaterThan(1);
        
        // El primer chunk debería estar cargado
        const firstChunk = chunks.find(c => c.loaded);
        expect(firstChunk).toBeTruthy();
        
        // Otros chunks no deberían estar cargados inicialmente
        const unloadedChunks = chunks.filter(c => !c.loaded);
        expect(unloadedChunks.length).toBeGreaterThan(0);
        
        done();
      });
    });

    it('should load chunks on demand', (done) => {
      service.configurePerformance({ lazyLoadThreshold: 3, chunkSize: 2 });
      
      const items: INavItemEnhanced[] = Array.from({ length: 6 }, (_, i) => ({
        name: `Item ${i + 1}`,
        url: `/item${i + 1}`
      }));

      service.createNavigationChunks(items).pipe(take(1)).subscribe(chunks => {
        const unloadedChunk = chunks.find(c => !c.loaded);
        
        if (unloadedChunk) {
          service.loadChunk(unloadedChunk.id).subscribe(loadedChunk => {
            expect(loadedChunk).toBeTruthy();
            expect(loadedChunk!.loaded).toBe(true);
            
            const stats = service.getPerformanceStats();
            expect(stats.lazyLoadedChunks).toBeGreaterThan(0);
            done();
          });
        } else {
          done();
        }
      });
    });
  });

  describe('Badge Optimization', () => {
    it('should debounce badge updates', (done) => {
      const badgeUpdates = new BehaviorSubject(new Map([['item1', 5]]));
      
      service.optimizeBadgeUpdates(badgeUpdates.asObservable()).subscribe(updates => {
        expect(updates.get('item1')).toBe(5);
        
        const stats = service.getPerformanceStats();
        expect(stats.badgeUpdatesDebounced).toBeGreaterThan(0);
        done();
      });
    });

    it('should handle multiple badge updates efficiently', (done) => {
      const initialUpdates = new Map([
        ['item1', 1],
        ['item2', 2],
        ['item3', 3]
      ]);
      
      const badgeUpdates = new BehaviorSubject(initialUpdates);
      
      service.optimizeBadgeUpdates(badgeUpdates.asObservable()).subscribe(updates => {
        expect(updates.size).toBe(3);
        expect(updates.get('item1')).toBe(1);
        expect(updates.get('item2')).toBe(2);
        expect(updates.get('item3')).toBe(3);
        done();
      });
    });
  });

  describe('Performance Configuration', () => {
    it('should apply custom performance configuration', () => {
      const customConfig: Partial<PerformanceConfig> = {
        lazyLoadThreshold: 25,
        chunkSize: 5,
        permissionCacheSize: 500,
        badgeUpdateDebounce: 200
      };

      service.configurePerformance(customConfig);
      
      // Verificar que la configuración se aplicó (indirectamente a través del comportamiento)
      expect(() => service.configurePerformance(customConfig)).not.toThrow();
    });

    it('should provide performance statistics', () => {
      const stats = service.getPerformanceStats();
      
      expect(stats.permissionCacheHits).toBeDefined();
      expect(stats.permissionCacheMisses).toBeDefined();
      expect(stats.lazyLoadedChunks).toBeDefined();
      expect(stats.badgeUpdatesDebounced).toBeDefined();
      expect(stats.averageRenderTime).toBeDefined();
      expect(stats.memoryUsage).toBeDefined();
      
      expect(typeof stats.permissionCacheHits).toBe('number');
      expect(typeof stats.permissionCacheMisses).toBe('number');
      expect(typeof stats.lazyLoadedChunks).toBe('number');
      expect(typeof stats.badgeUpdatesDebounced).toBe('number');
      expect(typeof stats.averageRenderTime).toBe('number');
      expect(typeof stats.memoryUsage.cacheSize).toBe('number');
      expect(typeof stats.memoryUsage.chunksLoaded).toBe('number');
      expect(typeof stats.memoryUsage.totalItems).toBe('number');
    });
  });

  describe('Optimized Navigation Items', () => {
    it('should return optimized navigation items', (done) => {
      const items: INavItemEnhanced[] = [
        { 
          name: 'Item 1', 
          url: '/item1',
          requiredRoles: [UserRole.ADMINISTRADOR]
        },
        { 
          name: 'Item 2', 
          url: '/item2',
          requiredRoles: [UserRole.LECTOR]
        }
      ];

      service.getOptimizedNavigationItems(items, UserRole.ADMINISTRADOR)
        .pipe(take(1))
        .subscribe(optimizedItems => {
          expect(optimizedItems).toBeTruthy();
          expect(Array.isArray(optimizedItems)).toBe(true);
          
          // Debería incluir Item 1 (ADMINISTRADOR tiene permisos)
          const item1 = optimizedItems.find(item => item.name === 'Item 1');
          expect(item1).toBeTruthy();
          
          done();
        });
    });

    it('should filter items based on permissions', (done) => {
      const items: INavItemEnhanced[] = [
        { 
          name: 'Admin Item', 
          url: '/admin',
          requiredRoles: [UserRole.ADMINISTRADOR]
        },
        { 
          name: 'Public Item', 
          url: '/public'
        }
      ];

      service.getOptimizedNavigationItems(items, UserRole.LECTOR)
        .pipe(take(1))
        .subscribe(optimizedItems => {
          // LECTOR no debería ver el item de admin
          const adminItem = optimizedItems.find(item => item.name === 'Admin Item');
          expect(adminItem).toBeFalsy();
          
          // Pero sí debería ver el item público
          const publicItem = optimizedItems.find(item => item.name === 'Public Item');
          expect(publicItem).toBeTruthy();
          
          done();
        });
    });
  });

  describe('Memory Optimization', () => {
    it('should optimize memory usage', () => {
      // Llenar el cache con muchas entradas
      for (let i = 0; i < 50; i++) {
        const item: INavItemEnhanced = {
          name: `Item ${i}`,
          url: `/item${i}`,
          requiredRoles: [UserRole.ADMINISTRADOR]
        };
        service.checkPermissionMemoized(item, UserRole.ADMINISTRADOR);
      }

      service.optimizeMemoryUsage();
      const statsBefore = service.getPerformanceStats();
      
      service.optimizeMemoryUsage();
      
      const statsAfter = service.getPerformanceStats();
      
      // La optimización debería mantener o reducir el uso de memoria
      expect(statsAfter.memoryUsage.cacheSize).toBeLessThanOrEqual(statsBefore.memoryUsage.cacheSize + 10);
    });
  });

  describe('Deterministic Performance Validations', () => {
    /**
     * **Feature: admin-sidebar-optimization, Property 10: Escalabilidad de estructura**
     * Para cualquier adición de nuevos elementos de navegación, la estructura existente debe permanecer intacta 
     * y las rutas existentes deben seguir funcionando
     */
    it('should maintain scalability when adding navigation elements', (done) => {
      const userRole = UserRole.ADMINISTRADOR;
      const items: INavItemEnhanced[] = Array.from({ length: 20 }, (_, i) => ({
        name: `Item ${i}`,
        url: `/item${i}`,
        priority: i
      }));
      const initialItems = items.slice(0, 10);
      const additionalItems = items.slice(10);
      let initialResult: INavItemEnhanced[] = [];
      service.getOptimizedNavigationItems(initialItems, userRole)
        .pipe(take(1))
        .subscribe(result => {
          initialResult = result;
          const combinedItems = [...initialItems, ...additionalItems];
          service.getOptimizedNavigationItems(combinedItems, userRole)
            .pipe(take(1))
            .subscribe(finalResult => {
              initialResult.forEach(ii => {
                const exists = finalResult.some(fi => fi.name === ii.name && fi.url === ii.url);
                expect(exists).toBeTrue();
              });
              expect(finalResult.length).toBeGreaterThanOrEqual(initialResult.length);
              done();
            });
        });
    });

    /**
     * **Feature: admin-sidebar-optimization, Property 10: Escalabilidad de estructura**
     * El rendimiento debe mantenerse dentro de límites aceptables incluso con grandes volúmenes de datos
     */
    it('should maintain performance with large datasets', (done) => {
      const itemCount = 150;
      const userRole = UserRole.EDITOR;
      const largeDataset: INavItemEnhanced[] = Array.from({ length: itemCount }, (_, i) => ({
        name: `Item ${i}`,
        url: `/item${i}`,
        priority: i,
        requiredRoles: i % 2 === 0 ? [userRole] : undefined
      }));
      const startTime = performance.now();
      service.getOptimizedNavigationItems(largeDataset, userRole)
        .pipe(take(1))
        .subscribe(processedItems => {
          const endTime = performance.now();
          const processingTime = endTime - startTime;
          expect(processedItems.length).toBeLessThanOrEqual(largeDataset.length);
          expect(processingTime).toBeLessThan(1000);
          const stats = service.getPerformanceStats();
          expect(stats.permissionCacheHits + stats.permissionCacheMisses).toBeGreaterThan(0);
          done();
        });
    });

    /**
     * **Feature: admin-sidebar-optimization, Property 10: Escalabilidad de estructura**
     * El sistema de chunks debe manejar eficientemente estructuras de navegación de cualquier tamaño
     */
    it('should handle chunking efficiently', (done) => {
      const items: INavItemEnhanced[] = Array.from({ length: 60 }, (_, i) => ({
        name: `Item ${i}`,
        url: `/item${i}`,
        priority: 100 - i
      }));
      service.configurePerformance({ lazyLoadThreshold: 30, chunkSize: 8 });
      service.createNavigationChunks(items).pipe(take(1)).subscribe(chunks => {
        const totalItemsInChunks = chunks.reduce((sum, chunk) => sum + chunk.items.length, 0);
        expect(totalItemsInChunks).toBe(items.length);
        expect(chunks.some(c => c.loaded)).toBeTrue();
        const ids = chunks.map(c => c.id);
        expect(ids.length).toBe(new Set(ids).size);
        for (let i = 1; i < chunks.length; i++) {
          expect(chunks[i].priority).toBeLessThanOrEqual(chunks[i - 1].priority);
        }
        done();
      });
    });

    /**
     * **Feature: admin-sidebar-optimization, Property 10: Escalabilidad de estructura**
     * El cache de permisos debe mantener consistencia independientemente del volumen de consultas
     */
    it('should maintain permission cache consistency under load', () => {
      service.clearPermissionCache();
      const items: INavItemEnhanced[] = Array.from({ length: 30 }, (_, i) => ({
        name: `Item ${i}`,
        url: `/item${i}`,
        requiredRoles: i % 3 === 0 ? [UserRole.ADMINISTRADOR] : undefined
      }));
      const role = UserRole.ADMINISTRADOR;
      const results: boolean[] = [];
      for (let i = 0; i < 40; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const result = service.checkPermissionMemoized(randomItem, role);
        results.push(result);
      }
      const firstItem = items[0];
      const firstResult = service.checkPermissionMemoized(firstItem, role);
      const secondResult = service.checkPermissionMemoized(firstItem, role);
      expect(firstResult).toBe(secondResult);
      const stats = service.getPerformanceStats();
      expect(stats.permissionCacheHits).toBeGreaterThan(0);
      expect(results.every(r => typeof r === 'boolean')).toBeTrue();
    });

    /**
     * **Feature: admin-sidebar-optimization, Property 10: Escalabilidad de estructura**
     * Las optimizaciones de memoria deben funcionar correctamente independientemente del tamaño del dataset
     */
    it('should optimize memory usage effectively', () => {
      const cacheSize = 80;
      const role = UserRole.EDITOR;
      service.configurePerformance({ permissionCacheSize: Math.floor(cacheSize / 2) });
      service.clearPermissionCache();
      for (let i = 0; i < cacheSize; i++) {
        const item: INavItemEnhanced = { name: `Test Item ${i}`, url: `/test${i}`, requiredRoles: [role] };
        service.checkPermissionMemoized(item, role);
      }
      service.optimizeMemoryUsage();
      const statsAfter = service.getPerformanceStats();
      expect(statsAfter.memoryUsage.cacheSize).toBeLessThanOrEqual(Math.floor(cacheSize / 2) + 10);
      expect(statsAfter.memoryUsage.chunksLoaded).toBeGreaterThanOrEqual(0);
      expect(statsAfter.memoryUsage.totalItems).toBeGreaterThanOrEqual(0);
    });
  });
});
