import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { UsuarioService } from './usuario.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';
import { of, throwError } from 'rxjs';

describe('UsuarioService request shapes', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: TokenStorageService,
          useValue: {
            getToken: () => null,
          },
        },
      ],
    });
    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('buscarSafe posts payload and paging params', () => {
    service.buscarSafe({ q: 'x' }, 1, 20).subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/usuarios/buscar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe('1');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe('20');
    req.flush({ data: { elements: [], totalPages: 0 } });
  });

  it('buscarSinGlobalLoader sets paging params and skip-loader context', () => {
    service.buscarSinGlobalLoader({ q: 'x' }, 0, 10).subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/usuarios/buscar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe('0');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe('10');
    expect(req.request.context.get(SKIP_GLOBAL_LOADER)).toBe(true);
    req.flush({ data: { elements: [], totalPages: 0 } });
  });

  it('obtenerDatosSesionActualSafe maps resp.data', () => {
    service.obtenerDatosSesionActualSafe().subscribe((p) => {
      expect(p.username).toBe('u');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/usuarios/perfil/yo'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: { username: 'u' } });
  });

  it('obtenerDatosSesionActual uses raw GET endpoint', () => {
    service.obtenerDatosSesionActual().subscribe(() => {});
    const req = httpMock.expectOne((r) => r.url.includes('/usuarios/perfil/yo'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: { username: 'u' } });
  });

  it('actualizarParcial uses PATCH with json-patch content-type', () => {
    service.actualizarParcial('u', { username: 'x' } as any).subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/usuarios/perfil/u'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('Content-Type')).toBe('application/json-patch+json');
    req.flush({ result: { success: true }, data: {} });
  });

  it('getUsernameActual returns username when available', async () => {
    spyOn(service, 'obtenerDatosSesionActualSafe').and.returnValue(of({ username: 'u' } as any));
    await expectAsync(service.getUsernameActual()).toBeResolvedTo('u');
  });

  it('getUsernameActual returns fallback when observable errors', async () => {
    spyOn(service, 'obtenerDatosSesionActualSafe').and.returnValue(
      throwError(() => new Error('fail'))
    );
    await expectAsync(service.getUsernameActual()).toBeResolvedTo('Usuario no disponible');
  });
});
