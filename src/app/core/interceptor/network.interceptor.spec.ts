import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpContext,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { NetworkInterceptor, SKIP_GLOBAL_LOADER } from './network.interceptor';
import { LoadingService } from '../services/ui/loading.service';
import { ToastService } from '../services/ui/toast.service';
import { LoggerService } from '../services/logger.service';
import { Router } from '@angular/router';
import { SessionManagerService } from '../services/auth/session-manager.service';

describe('NetworkInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let interceptor: NetworkInterceptor;
  let loading: jasmine.SpyObj<LoadingService>;
  let toast: jasmine.SpyObj<ToastService>;
  let logger: jasmine.SpyObj<LoggerService>;
  let router: jasmine.SpyObj<Router>;
  let sessionManager: jasmine.SpyObj<SessionManagerService>;

  beforeEach(() => {
    loading = jasmine.createSpyObj('LoadingService', ['setGlobalLoading']);
    toast = jasmine.createSpyObj('ToastService', ['showError', 'showWarning']);
    logger = jasmine.createSpyObj('LoggerService', ['debug', 'warn', 'error', 'info']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    sessionManager = jasmine.createSpyObj('SessionManagerService', ['notifySessionExpired']);

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
        { provide: ToastService, useValue: toast },
        { provide: LoggerService, useValue: logger },
        { provide: Router, useValue: router },
        { provide: SessionManagerService, useValue: sessionManager },
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

    expect(loading.setGlobalLoading).toHaveBeenCalledWith(true, jasmine.any(String));

    const req = httpMock.expectOne((r) => r.url === '/api/v1/demo');
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });

    expect(loading.setGlobalLoading).toHaveBeenCalledWith(false, jasmine.any(String));
  });

  it('omite loader global cuando el contexto lo indica', () => {
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);

    http.get('/api/v1/demo2', { context }).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/demo2');
    req.flush({ data: {} });

    expect(loading.setGlobalLoading).not.toHaveBeenCalled();
  });

  it('omite loader global para URLs excluidas', () => {
    http.get('/assets/i18n/es.json').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/assets/i18n/es.json');
    req.flush({ data: {} });

    expect(loading.setGlobalLoading).not.toHaveBeenCalled();
  });

  it('no muestra notificación en errores 404 por defecto', () => {
    http.get('/api/v1/prueba').subscribe({ error: () => {} });
    const req = httpMock.expectOne((r) => r.url === '/api/v1/prueba');
    req.flush('x', { status: 404, statusText: 'Not Found' });

    expect(toast.showError).not.toHaveBeenCalled();
    expect(toast.showWarning).not.toHaveBeenCalled();
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
