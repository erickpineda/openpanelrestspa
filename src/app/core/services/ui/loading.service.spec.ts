import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';
import { LoggerService } from '../logger.service';
import { ToastService } from './toast.service';

describe('LoadingService', () => {
  let service: LoadingService;
  let logger: jasmine.SpyObj<LoggerService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let latestGlobal: boolean | undefined;
  let latestError: any;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2025, 0, 1));

    logger = jasmine.createSpyObj<LoggerService>('LoggerService', [
      'debug',
      'info',
      'warn',
      'error',
    ]);
    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['showError']);

    TestBed.configureTestingModule({
      providers: [
        LoadingService,
        { provide: LoggerService, useValue: logger },
        { provide: ToastService, useValue: toastService },
      ],
    });

    service = TestBed.inject(LoadingService);
    (service as any).minimumDisplayTime = 0;
    (service as any).maxWaitMs = 20;

    service.globalLoading$.subscribe((v) => {
      latestGlobal = v;
    });
    service.error$.subscribe((v) => {
      latestError = v;
    });
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('setGlobalLoading activa y desactiva global y tracking por requestId', () => {
    service.setGlobalLoading(true, 'r1');

    expect(service.getLoadingStats()).toEqual({
      activeRequests: 1,
      trackedRequests: 1,
      isLoading: true,
    });
    expect(latestGlobal).toBe(true);
    expect(logger.debug).toHaveBeenCalled();

    service.setGlobalLoading(false, 'r1');
    jasmine.clock().tick(0);

    expect(service.getLoadingStats()).toEqual({
      activeRequests: 0,
      trackedRequests: 0,
      isLoading: false,
    });
    expect(latestGlobal).toBe(false);
    expect(logger.debug).toHaveBeenCalled();
  });

  it('setGlobalLoading dispara timeout máximo y fuerza parada con error', () => {
    service.setGlobalLoading(true);
    expect(latestGlobal).toBe(true);

    jasmine.clock().tick(25);

    expect(latestError.active).toBe(true);
    expect(latestError.code).toBe('TIMEOUT');
    expect(toastService.showError).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
    expect(service.getLoadingStats().activeRequests).toBe(0);
    expect(latestGlobal).toBe(false);
  });

  it('triggerRetry ejecuta handler registrado y limpia el estado de error', () => {
    const handler = jasmine.createSpy('handler');
    service.setError('x', 'E');
    service.registerRetryHandler(handler);

    service.triggerRetry();

    expect(logger.info).toHaveBeenCalled();
    expect(handler).toHaveBeenCalled();
    expect(latestError.active).toBe(false);
    expect(service.getLoadingStats().activeRequests).toBe(1);

    service.setGlobalLoading(false);
    jasmine.clock().tick(0);

    expect(latestGlobal).toBe(false);
  });

  it('triggerRetry captura excepciones del handler y muestra notificación', () => {
    const handler = jasmine.createSpy('handler').and.throwError('Retry failed');
    service.registerRetryHandler(handler);

    service.triggerRetry();

    expect(handler).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    expect(toastService.showError).toHaveBeenCalled();
    expect(service.getLoadingStats().activeRequests).toBe(0);
  });
});
