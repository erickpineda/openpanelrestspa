import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpContext,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { NetworkInterceptor } from './network.interceptor';
import { LoadingService } from '../services/ui/loading.service';
import { NotificationService } from '../services/ui/notification.service';
import { LoggerService } from '../services/logger.service';

describe('NetworkInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let interceptor: NetworkInterceptor;
  let loading: jasmine.SpyObj<LoadingService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let logger: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    loading = jasmine.createSpyObj('LoadingService', ['setGlobalLoading']);
    notifications = jasmine.createSpyObj('NotificationService', [
      'show',
      'success',
      'error',
      'warning',
      'info',
    ]);
    logger = jasmine.createSpyObj('LoggerService', ['debug', 'warn', 'error']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        NetworkInterceptor,
        {
          provide: HTTP_INTERCEPTORS,
          useExisting: NetworkInterceptor,
          multi: true,
        },
        { provide: LoadingService, useValue: loading },
        { provide: NotificationService, useValue: notifications },
        { provide: LoggerService, useValue: logger },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    interceptor = TestBed.inject(NetworkInterceptor);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('activa y desactiva loader global en éxito', () => {
    http.get('/api/v1/demo').subscribe();

    expect(interceptor.getActiveRequestsCount()).toBe(1);
    expect(loading.setGlobalLoading).toHaveBeenCalledWith(true);

    const req = httpMock.expectOne((r) => r.url === '/api/v1/demo');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush({ data: {} });

    expect(interceptor.getActiveRequestsCount()).toBe(0);
    expect(loading.setGlobalLoading).toHaveBeenCalledWith(false);
  });

  it('omite loader global cuando el contexto lo indica', () => {
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);

    http.get('/api/v1/demo2', { context }).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/demo2');
    req.flush({ data: {} });

    expect(loading.setGlobalLoading).not.toHaveBeenCalled();
  });

  it('omite loader global para URLs excluidas', () => {
    http.get('/api/v1/auth/refreshToken').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/auth/refreshToken');
    req.flush({ data: {} });

    expect(loading.setGlobalLoading).not.toHaveBeenCalled();
  });

  it('no muestra notificación en errores de URLs silenciosas', () => {
    http.get('/api/v1/prueba').subscribe({ error: () => {} });
    const req = httpMock.expectOne((r) => r.url === '/api/v1/prueba');
    req.flush('x', { status: 404, statusText: 'Not Found' });

    expect(logger.warn).toHaveBeenCalled();
    expect(notifications.error).not.toHaveBeenCalled();
    expect(notifications.warning).not.toHaveBeenCalled();
  });

  it('muestra notificación warning en 404 no silencioso', () => {
    http.get('/api/v1/noexiste').subscribe({ error: () => {} });
    const req = httpMock.expectOne((r) => r.url === '/api/v1/noexiste');
    req.flush('x', { status: 404, statusText: 'Not Found' });

    expect(logger.warn).toHaveBeenCalled();
    expect(notifications.warning).toHaveBeenCalledWith('El recurso solicitado no fue encontrado.');
  });

  it('no fuerza Content-Type cuando el body es FormData', () => {
    const form = new FormData();
    form.append('f', '1');

    http.post('/api/v1/upload', form).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/upload');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBeNull();
    req.flush({ data: {} });
  });
});
