import { TestBed } from '@angular/core/testing';
import { of, take, throwError, Subject, toArray } from 'rxjs';
import { skip } from 'rxjs/operators';
import { BadgeCounterService } from './badge-counter.service';
import { ComentarioService } from '../data/comentario.service';
import { EntradaService } from '../data/entrada.service';
import { UsuarioService } from '../data/usuario.service';
import { TemporaryStorageService } from './temporary-storage.service';

fdescribe('BadgeCounterService', () => {
  let service: BadgeCounterService;
  let mockComentarioService: jasmine.SpyObj<ComentarioService>;
  let mockEntradaService: jasmine.SpyObj<EntradaService>;
  let mockUsuarioService: jasmine.SpyObj<UsuarioService>;
  let mockTemporaryStorage: jasmine.SpyObj<TemporaryStorageService>;

  beforeEach(() => {
    const comentarioSpy = jasmine.createSpyObj('ComentarioService', ['listarSafe']);
    const entradaSpy = jasmine.createSpyObj('EntradaService', ['listarSafe']);
    const usuarioSpy = jasmine.createSpyObj('UsuarioService', ['listarSafe', 'obtenerDatosSesionActualSafe']);
    const tempSpy = jasmine.createSpyObj('TemporaryStorageService', ['getTemporaryEntriesByType']);
    (tempSpy as any).entriesChanged$ = new Subject<void>();
    
    // Configurar mocks por defecto para evitar errores en constructor
    comentarioSpy.listarSafe.and.returnValue(of([] as any));
    entradaSpy.listarSafe.and.returnValue(of([] as any));
    usuarioSpy.listarSafe.and.returnValue(of([] as any));
    usuarioSpy.obtenerDatosSesionActualSafe.and.returnValue(of({} as any));
    tempSpy.getTemporaryEntriesByType.and.returnValue([]);

    TestBed.configureTestingModule({
      providers: [
        BadgeCounterService,
        { provide: ComentarioService, useValue: comentarioSpy },
        { provide: EntradaService, useValue: entradaSpy },
        { provide: UsuarioService, useValue: usuarioSpy },
        { provide: TemporaryStorageService, useValue: tempSpy },
      ],
    });

    service = TestBed.inject(BadgeCounterService);
    mockComentarioService = TestBed.inject(ComentarioService) as jasmine.SpyObj<ComentarioService>;
    mockEntradaService = TestBed.inject(EntradaService) as jasmine.SpyObj<EntradaService>;
    mockUsuarioService = TestBed.inject(UsuarioService) as jasmine.SpyObj<UsuarioService>;
    mockTemporaryStorage = TestBed.inject(TemporaryStorageService) as jasmine.SpyObj<TemporaryStorageService>;

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

      service.getUnmoderatedCommentsCount().pipe(skip(1)).subscribe((count) => {
        expect(count).toBe(3); // 2 PENDIENTE + 1 REPORTADO
        done();
      });
    });

    it('should return 0 when service fails', (done) => {
      mockComentarioService.listarSafe.and.returnValue(throwError('Service error'));

      service.getUnmoderatedCommentsCount().pipe(skip(1)).subscribe((count) => {
        expect(count).toBe(0);
        done();
      });
    });
  });

  describe('getDraftEntriesCount', () => {
    it('should return count of draft entries', (done) => {
      const mockEntries = [
        { id: '1', formType: 'entrada' },
        { id: '2', formType: 'entrada' }
      ];

      mockTemporaryStorage.getTemporaryEntriesByType.and.returnValue(mockEntries as any);

      service.getDraftEntriesCount().pipe(take(1)).subscribe((count) => {
        expect(count).toBe(2);
        done();
      });
    });

    it('should return 0 when service fails', (done) => {
      mockTemporaryStorage.getTemporaryEntriesByType.and.throwError('Storage error');

      service.getDraftEntriesCount().pipe(take(1)).subscribe((count) => {
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

      service.getPendingUsersCount().pipe(skip(1)).subscribe((count) => {
        expect(count).toBe(2); // 1 PENDIENTE + 1 INACTIVO
        done();
      });
    });

    it('should return 0 when service fails', (done) => {
      mockUsuarioService.listarSafe.and.returnValue(throwError('Service error'));

      service.getPendingUsersCount().pipe(skip(1)).subscribe((count) => {
        expect(count).toBe(0);
        done();
      });
    });
  });

  describe('getMyDraftsCount', () => {
    it('should return count of user drafts', (done) => {
      const mockUser = { username: 'user1' };
      const mockEntradas = [
        { id: 1, estado: 'BORRADOR', autor: { username: 'user1' } },
        { id: 2, estado: 'BORRADOR', autor: { username: 'user2' } },
        { id: 3, estado: 'TEMPORAL', usuarioNombre: 'user1' },
      ];

      mockUsuarioService.obtenerDatosSesionActualSafe.and.returnValue(of(mockUser as any));
      mockEntradaService.listarSafe.and.returnValue(of(mockEntradas as any));

      service.getMyDraftsCount().pipe(take(2), toArray()).subscribe((counts) => {
        expect(counts[1]).toBe(2);
        done();
      });
    });

    it('should return 0 when user is not available', (done) => {
      mockUsuarioService.obtenerDatosSesionActualSafe.and.returnValue(of({} as any));

      // Use skip(1) to bypass startWith(0)
      service.getMyDraftsCount().pipe(skip(1)).subscribe((count) => {
        expect(count).toBe(0);
        done();
      });
    });

    it('should return 0 when service fails', (done) => {
      mockUsuarioService.obtenerDatosSesionActualSafe.and.returnValue(
        throwError('Service error')
      );

      // Use skip(1) to bypass startWith(0)
      service.getMyDraftsCount().pipe(skip(1)).subscribe((count) => {
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
      mockTemporaryStorage.getTemporaryEntriesByType.and.returnValue(
        Array(25).fill({ formType: 'entrada' }) as any // 25 drafts > 20 threshold
      );
      mockUsuarioService.listarSafe.and.returnValue(
        of(
          Array(8).fill({ estado: 'PENDIENTE' }) as any // 8 pending users > 5 threshold
        )
      );

      // Note: getSystemAlertsCount combines streams. 
      // Comments & Users have startWith(0). Drafts emits immediately.
      // 1. [0, 25, 0] -> 1 alert
      // 2. [15, 25, 0] -> 2 alerts
      // 3. [15, 25, 8] -> 3 alerts
      
      service.getSystemAlertsCount().pipe(skip(1)).subscribe((count) => {
        if (count === 3) {
          expect(count).toBe(3);
          done();
        }
      });
    });

    it('should return 0 alerts when counts are below thresholds', (done) => {
      // Mock services to return low counts
      mockComentarioService.listarSafe.and.returnValue(
        of(
          Array(5).fill({ estado: 'PENDIENTE' }) as any // 5 < 10 threshold
        )
      );
      mockTemporaryStorage.getTemporaryEntriesByType.and.returnValue(
        Array(10).fill({ formType: 'entrada' }) as any // 10 < 20 threshold
      );
      mockUsuarioService.listarSafe.and.returnValue(
        of(
          Array(3).fill({ estado: 'PENDIENTE' }) as any // 3 < 5 threshold
        )
      );

      service.getSystemAlertsCount().pipe(skip(1)).subscribe((count) => {
         // Should settle at 0
         expect(count).toBe(0);
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
      const mockEntries = Array(3).fill({ formType: 'entrada' });
      const mockUsuarios = Array(2).fill({ estado: 'PENDIENTE' });

      mockComentarioService.listarSafe.and.returnValue(of(mockComentarios as any));
      mockTemporaryStorage.getTemporaryEntriesByType.and.returnValue(mockEntries as any);
      mockUsuarioService.listarSafe.and.returnValue(of(mockUsuarios as any));

      // Act & Assert: Multiple calls should return consistent values
      const expectedComments = 5;
      const expectedEntries = 3;
      const expectedUsers = 2;

      // Use skip(1) to bypass startWith(0) for comments
      service.getUnmoderatedCommentsCount().pipe(skip(1)).subscribe((count1) => {
        expect(count1).toBe(expectedComments);

        service.getUnmoderatedCommentsCount().pipe(skip(1)).subscribe((count2) => {
          expect(count2).toBe(expectedComments);
          expect(count1).toBe(count2);

          // Test entries consistency (No skip needed as it emits immediately)
          service.getDraftEntriesCount().pipe(take(1)).subscribe((entries1) => {
            expect(entries1).toBe(expectedEntries);

            service.getDraftEntriesCount().pipe(take(1)).subscribe((entries2) => {
              expect(entries2).toBe(expectedEntries);
              expect(entries1).toBe(entries2);

              // Test users consistency (Use skip(1) for startWith(0))
              service.getPendingUsersCount().pipe(skip(1)).subscribe((users1) => {
                expect(users1).toBe(expectedUsers);

                service.getPendingUsersCount().pipe(skip(1)).subscribe((users2) => {
                  expect(users2).toBe(expectedUsers);
                  expect(users1).toBe(users2);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
});
