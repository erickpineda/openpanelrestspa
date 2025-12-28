import { TestBed } from '@angular/core/testing';
import { of, take, throwError } from 'rxjs';
import { BadgeCounterService } from './badge-counter.service';
import { ComentarioService } from '../data/comentario.service';
import { EntradaService } from '../data/entrada.service';
import { UsuarioService } from '../data/usuario.service';

describe('BadgeCounterService', () => {
  let service: BadgeCounterService;
  let mockComentarioService: jasmine.SpyObj<ComentarioService>;
  let mockEntradaService: jasmine.SpyObj<EntradaService>;
  let mockUsuarioService: jasmine.SpyObj<UsuarioService>;

  beforeEach(() => {
    const comentarioSpy = jasmine.createSpyObj('ComentarioService', ['listarSafe']);
    const entradaSpy = jasmine.createSpyObj('EntradaService', ['listarSafe']);
    const usuarioSpy = jasmine.createSpyObj('UsuarioService', ['listarSafe']);

    // Configurar mocks por defecto para evitar errores en constructor
    comentarioSpy.listarSafe.and.returnValue(of([] as any));
    entradaSpy.listarSafe.and.returnValue(of([] as any));
    usuarioSpy.listarSafe.and.returnValue(of([] as any));

    TestBed.configureTestingModule({
      providers: [
        BadgeCounterService,
        { provide: ComentarioService, useValue: comentarioSpy },
        { provide: EntradaService, useValue: entradaSpy },
        { provide: UsuarioService, useValue: usuarioSpy },
      ],
    });

    service = TestBed.inject(BadgeCounterService);
    mockComentarioService = TestBed.inject(ComentarioService) as jasmine.SpyObj<ComentarioService>;
    mockEntradaService = TestBed.inject(EntradaService) as jasmine.SpyObj<EntradaService>;
    mockUsuarioService = TestBed.inject(UsuarioService) as jasmine.SpyObj<UsuarioService>;

    service.configureFallbacks({
      retryDelayMs: 10,
      maxRetries: 0,
      enableLogging: false,
    });
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUnmoderatedCommentsCount', () => {
    it('should return count of unmoderated comments', (done) => {
      const mockComentarios = [
        { id: 1, estado: 'PENDIENTE', texto: 'Comment 1' },
        { id: 2, estado: 'APROBADO', texto: 'Comment 2' },
        { id: 3, estado: 'REPORTADO', texto: 'Comment 3' },
        { id: 4, estado: 'PENDIENTE', texto: 'Comment 4' },
      ];

      mockComentarioService.listarSafe.and.returnValue(of(mockComentarios as any));

      service.getUnmoderatedCommentsCount().subscribe((count) => {
        expect(count).toBe(3); // 2 PENDIENTE + 1 REPORTADO
        done();
      });
    });

    it('should return 0 when service fails', (done) => {
      mockComentarioService.listarSafe.and.returnValue(throwError('Service error'));

      service.getUnmoderatedCommentsCount().subscribe((count) => {
        expect(count).toBe(0);
        done();
      });
    });
  });

  describe('getDraftEntriesCount', () => {
    it('should return count of draft entries', (done) => {
      const mockEntradas = [
        { id: 1, estado: 'BORRADOR', titulo: 'Entry 1' },
        { id: 2, estado: 'PUBLICADO', titulo: 'Entry 2' },
        { id: 3, estado: 'TEMPORAL', titulo: 'Entry 3' },
      ];

      mockEntradaService.listarSafe.and.returnValue(of(mockEntradas as any));

      service.getDraftEntriesCount().subscribe((count) => {
        expect(count).toBe(2); // 1 BORRADOR + 1 TEMPORAL
        done();
      });
    });

    it('should return 0 when service fails', (done) => {
      mockEntradaService.listarSafe.and.returnValue(throwError('Service error'));

      service.getDraftEntriesCount().subscribe((count) => {
        expect(count).toBe(0);
        done();
      });
    });
  });

  describe('getPendingUsersCount', () => {
    it('should return count of pending users', (done) => {
      const mockUsuarios = [
        { id: 1, estado: 'PENDIENTE', username: 'user1' },
        { id: 2, estado: 'ACTIVO', username: 'user2' },
        { id: 3, estado: 'INACTIVO', username: 'user3' },
      ];

      mockUsuarioService.listarSafe.and.returnValue(of(mockUsuarios as any));

      service.getPendingUsersCount().subscribe((count) => {
        expect(count).toBe(2); // 1 PENDIENTE + 1 INACTIVO
        done();
      });
    });

    it('should return 0 when service fails', (done) => {
      mockUsuarioService.listarSafe.and.returnValue(throwError('Service error'));

      service.getPendingUsersCount().subscribe((count) => {
        expect(count).toBe(0);
        done();
      });
    });
  });

  describe('getSystemAlertsCount', () => {
    it('should calculate system alerts based on thresholds', (done) => {
      // Mock services to return high counts
      mockComentarioService.listarSafe.and.returnValue(
        of(
          Array(15).fill({ estado: 'PENDIENTE' }) as any // 15 pending comments > 10 threshold
        )
      );
      mockEntradaService.listarSafe.and.returnValue(
        of(
          Array(25).fill({ estado: 'BORRADOR' }) as any // 25 drafts > 20 threshold
        )
      );
      mockUsuarioService.listarSafe.and.returnValue(
        of(
          Array(8).fill({ estado: 'PENDIENTE' }) as any // 8 pending users > 5 threshold
        )
      );

      service.getSystemAlertsCount().subscribe((count) => {
        expect(count).toBe(3); // All three thresholds exceeded
        done();
      });
    });

    it('should return 0 alerts when counts are below thresholds', (done) => {
      // Mock services to return low counts
      mockComentarioService.listarSafe.and.returnValue(
        of(
          Array(5).fill({ estado: 'PENDIENTE' }) as any // 5 < 10 threshold
        )
      );
      mockEntradaService.listarSafe.and.returnValue(
        of(
          Array(10).fill({ estado: 'BORRADOR' }) as any // 10 < 20 threshold
        )
      );
      mockUsuarioService.listarSafe.and.returnValue(
        of(
          Array(3).fill({ estado: 'PENDIENTE' }) as any // 3 < 5 threshold
        )
      );

      service.getSystemAlertsCount().subscribe((count) => {
        expect(count).toBe(0); // No thresholds exceeded
        done();
      });
    });
  });

  describe('Counter Management', () => {
    it('should set counter value', (done) => {
      const counterId = 'test-counter';
      const value = 42;

      service.setCounterValue(counterId, value);

      service.getCounterById(counterId).subscribe((count) => {
        expect(count).toBe(value);
        done();
      });
    });

    it('should increment counter', (done) => {
      const counterId = 'test-counter';
      const initialValue = 10;
      const increment = 5;

      service.setCounterValue(counterId, initialValue);
      service.incrementCounter(counterId, increment);

      service.getCounterById(counterId).subscribe((count) => {
        expect(count).toBe(initialValue + increment);
        done();
      });
    });

    it('should decrement counter', (done) => {
      const counterId = 'test-counter';
      const initialValue = 10;
      const decrement = 3;

      service.setCounterValue(counterId, initialValue);
      service.decrementCounter(counterId, decrement);

      service.getCounterById(counterId).subscribe((count) => {
        expect(count).toBe(initialValue - decrement);
        done();
      });
    });

    it('should not decrement counter below zero', (done) => {
      const counterId = 'test-counter';
      const initialValue = 5;
      const decrement = 10;

      service.setCounterValue(counterId, initialValue);
      service.decrementCounter(counterId, decrement);

      service.getCounterById(counterId).subscribe((count) => {
        expect(count).toBe(0); // Should not go below 0
        done();
      });
    });

    it('should reset counter to zero', (done) => {
      const counterId = 'test-counter';
      const initialValue = 100;

      service.setCounterValue(counterId, initialValue);
      service.resetCounter(counterId);

      service.getCounterById(counterId).subscribe((count) => {
        expect(count).toBe(0);
        done();
      });
    });
  });

  describe('refreshAllCounters', () => {
    it('should refresh all counters without throwing errors', () => {
      // Mock all services to return empty arrays
      mockComentarioService.listarSafe.and.returnValue(of([] as any));
      mockEntradaService.listarSafe.and.returnValue(of([] as any));
      mockUsuarioService.listarSafe.and.returnValue(of([] as any));

      expect(() => {
        service.refreshAllCounters();
      }).not.toThrow();
    });
  });

  describe('Auto-refresh functionality', () => {
    it('should setup auto-refresh counter without errors', () => {
      const counterId = 'auto-test';
      const mockObservable = of(5);
      const interval = 1000;

      expect(() => {
        service.setupAutoRefreshCounter(counterId, mockObservable, interval);
      }).not.toThrow();
    });

    it('should stop auto-refresh for a counter', () => {
      const counterId = 'auto-test';
      const mockObservable = of(5);

      service.setupAutoRefreshCounter(counterId, mockObservable, 1000);

      expect(() => {
        service.stopAutoRefresh(counterId);
      }).not.toThrow();
    });
  });

  // PROPIEDAD 4: Badges dinámicos consistentes
  // Valida: Requisitos 3.1, 3.2, 3.3, 3.4, 3.5
  describe('Property 4: Dynamic badges consistency', () => {
    it('should maintain consistent badge values across multiple calls', (done) => {
      // Arrange: Mock consistent data
      const mockComentarios = Array(5).fill({ estado: 'PENDIENTE' });
      const mockEntradas = Array(3).fill({ estado: 'BORRADOR' });
      const mockUsuarios = Array(2).fill({ estado: 'PENDIENTE' });

      mockComentarioService.listarSafe.and.returnValue(of(mockComentarios as any));
      mockEntradaService.listarSafe.and.returnValue(of(mockEntradas as any));
      mockUsuarioService.listarSafe.and.returnValue(of(mockUsuarios as any));

      // Act & Assert: Multiple calls should return consistent values
      let callCount = 0;
      const expectedComments = 5;
      const expectedEntries = 3;
      const expectedUsers = 2;

      service.getUnmoderatedCommentsCount().subscribe((count1) => {
        expect(count1).toBe(expectedComments);

        service.getUnmoderatedCommentsCount().subscribe((count2) => {
          expect(count2).toBe(expectedComments);
          expect(count1).toBe(count2);
          callCount++;

          if (callCount === 1) {
            // Test entries consistency
            service.getDraftEntriesCount().subscribe((entries1) => {
              expect(entries1).toBe(expectedEntries);

              service.getDraftEntriesCount().subscribe((entries2) => {
                expect(entries2).toBe(expectedEntries);
                expect(entries1).toBe(entries2);
                callCount++;

                if (callCount === 2) {
                  // Test users consistency
                  service.getPendingUsersCount().subscribe((users1) => {
                    expect(users1).toBe(expectedUsers);

                    service.getPendingUsersCount().subscribe((users2) => {
                      expect(users2).toBe(expectedUsers);
                      expect(users1).toBe(users2);
                      done();
                    });
                  });
                }
              });
            });
          }
        });
      });
    });

    it('should handle badge updates gracefully when data changes', (done) => {
      // Arrange: Initial data
      const initialComentarios = Array(3).fill({ estado: 'PENDIENTE' });
      const updatedComentarios = Array(7).fill({ estado: 'PENDIENTE' });

      // Act: First call with initial data
      mockComentarioService.listarSafe.and.returnValue(of(initialComentarios as any));

      service.getUnmoderatedCommentsCount().subscribe((initialCount) => {
        expect(initialCount).toBe(3);

        // Update mock to return new data
        mockComentarioService.listarSafe.and.returnValue(of(updatedComentarios as any));

        // Second call should reflect updated data
        service.getUnmoderatedCommentsCount().subscribe((updatedCount) => {
          expect(updatedCount).toBe(7);
          expect(updatedCount).not.toBe(initialCount);
          done();
        });
      });
    });

    it('should provide consistent fallback behavior on service failures', (done) => {
      // Arrange: Mock service failures
      mockComentarioService.listarSafe.and.returnValue(
        throwError(() => new Error('Service error'))
      );
      mockEntradaService.listarSafe.and.returnValue(throwError(() => new Error('Service error')));
      mockUsuarioService.listarSafe.and.returnValue(throwError(() => new Error('Service error')));

      let completedCalls = 0;
      const expectedCalls = 4;

      // Act & Assert: All badge counters should consistently return 0 on failure
      service.getUnmoderatedCommentsCount().subscribe((count) => {
        expect(count).toBe(0);
        completedCalls++;
        if (completedCalls === expectedCalls) done();
      });

      service.getDraftEntriesCount().subscribe((count) => {
        expect(count).toBe(0);
        completedCalls++;
        if (completedCalls === expectedCalls) done();
      });

      service.getPendingUsersCount().subscribe((count) => {
        expect(count).toBe(0);
        completedCalls++;
        if (completedCalls === expectedCalls) done();
      });

      service.getSystemAlertsCount().subscribe((count) => {
        expect(count).toBe(0);
        completedCalls++;
        if (completedCalls === expectedCalls) done();
      });
    });

    it('should maintain badge state consistency during manual counter operations', (done) => {
      const counterId = 'test-badge';
      const initialValue = 10;

      service.setCounterValue(counterId, initialValue);

      service
        .getCounterById(counterId)
        .pipe(take(1))
        .subscribe((value1) => {
          expect(value1).toBe(initialValue);

          service.incrementCounter(counterId, 5);

          service
            .getCounterById(counterId)
            .pipe(take(1))
            .subscribe((value2) => {
              expect(value2).toBe(15);

              service.decrementCounter(counterId, 3);

              service
                .getCounterById(counterId)
                .pipe(take(1))
                .subscribe((value3) => {
                  expect(value3).toBe(12);

                  service.resetCounter(counterId);

                  service
                    .getCounterById(counterId)
                    .pipe(take(1))
                    .subscribe((value4) => {
                      expect(value4).toBe(0);
                      done();
                    });
                });
            });
        });
    });

    it('should ensure system alerts badge reflects accurate threshold-based calculations', (done) => {
      // Arrange: Set up data that crosses specific thresholds
      const commentsAboveThreshold = Array(12).fill({ estado: 'PENDIENTE' }); // > 10
      const entriesBelowThreshold = Array(15).fill({ estado: 'BORRADOR' }); // < 20
      const usersAboveThreshold = Array(8).fill({ estado: 'PENDIENTE' }); // > 5

      mockComentarioService.listarSafe.and.returnValue(of(commentsAboveThreshold as any));
      mockEntradaService.listarSafe.and.returnValue(of(entriesBelowThreshold as any));
      mockUsuarioService.listarSafe.and.returnValue(of(usersAboveThreshold as any));

      // Act & Assert: Should have exactly 2 alerts (comments + users, but not entries)
      service.getSystemAlertsCount().subscribe((alertCount) => {
        expect(alertCount).toBe(2);

        // Verify consistency with multiple calls
        service.getSystemAlertsCount().subscribe((alertCount2) => {
          expect(alertCount2).toBe(2);
          expect(alertCount).toBe(alertCount2);
          done();
        });
      });
    });
  });
});
