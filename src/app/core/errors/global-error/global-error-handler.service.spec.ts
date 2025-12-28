import { TestBed } from '@angular/core/testing';
import { Injector, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../services/ui/toast.service';
import { LoggerService } from '../../services/logger.service';
import { GlobalErrorHandlerService } from './global-error-handler.service';

describe('GlobalErrorHandlerService', () => {
  let service: GlobalErrorHandlerService;
  let toast: jasmine.SpyObj<ToastService>;

  const originalAddEventListener = window.addEventListener.bind(window);
  const originalRemoveEventListener = window.removeEventListener.bind(window);
  let originalOnUnhandledRejection: any;
  let unhandledRejectionListener: any;

  beforeEach(() => {
    toast = jasmine.createSpyObj<ToastService>('ToastService', [
      'showError',
      'showWarning',
      'showInfo',
    ]);

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandlerService,
        { provide: ToastService, useValue: toast },
        {
          provide: Router,
          useValue: {
            url: '/#/admin',
            navigate: () => Promise.resolve(true),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            info: () => {},
            warn: () => {},
            error: () => {},
          },
        },
        {
          provide: NgZone,
          useFactory: () => new NgZone({ enableLongStackTrace: false }),
        },
        Injector,
      ],
    });

    originalOnUnhandledRejection = (window as any).onunhandledrejection;
    unhandledRejectionListener = undefined;

    spyOn(window, 'addEventListener').and.callFake(((type: any, listener: any, options: any) => {
      if (type === 'unhandledrejection') {
        unhandledRejectionListener = listener;
      }
      return originalAddEventListener(type, listener, options);
    }) as any);

    service = TestBed.inject(GlobalErrorHandlerService);
  });

  afterEach(() => {
    try {
      if (unhandledRejectionListener) {
        originalRemoveEventListener('unhandledrejection', unhandledRejectionListener, true);
      }
    } catch {}

    try {
      (window as any).onunhandledrejection = originalOnUnhandledRejection;
    } catch {}
  });

  it('shows error toast for server errors', () => {
    const httpError = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
      url: '/api',
      error: { message: 'boom' },
    });

    service.handleError(httpError);

    expect(toast.showError).toHaveBeenCalled();
  });

  it('extracts and shows backend validation error message', () => {
    const backendError = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      url: '/api',
      error: {
        result: {
          trackingId: 't',
          timestamp: String(Date.now()),
          success: false,
          message: 'Fallo',
        },
        error: {
          timestamp: String(Date.now()),
          status: 400,
          message: 'Validation failed',
          details: ['entradaDTO : Campo requerido'],
        },
      },
    });

    service.handleError(backendError);

    expect(toast.showError).toHaveBeenCalledWith('Campo requerido', 'Error de Validación');

    const extracted = service.getValidationErrors(backendError);
    expect(extracted).toEqual(['entradaDTO : Campo requerido']);
  });

  it('normalizes promise rejection into HttpErrorResponse', () => {
    const rejection = {
      status: 400,
      statusText: 'Bad Request',
      url: '/api',
      error: {
        result: {
          trackingId: 'e2e',
          timestamp: String(Date.now()),
          success: false,
          message: 'Fallo',
        },
        error: {
          timestamp: String(Date.now()),
          status: 400,
          message: 'Validation failed',
          details: ['entradaDTO : Campo requerido'],
        },
      },
    } as any;

    const normalized = (service as any).normalizePromiseRejection(rejection);
    expect(normalized instanceof HttpErrorResponse).toBeTrue();
    expect((normalized as HttpErrorResponse).status).toBe(400);
    expect((service as any).isBackendErrorResponse(normalized)).toBeTrue();
  });
});
