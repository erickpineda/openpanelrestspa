import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EtiquetaService } from './etiqueta.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';

describe('EtiquetaService request shapes', () => {
  let service: EtiquetaService;
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

    service = TestBed.inject(EtiquetaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('buscar adds paging params only when provided', () => {
    service.buscar({ q: 'x' }, 2, 25).subscribe(() => {});
    const req1 = httpMock.expectOne((r) => r.url.includes('/etiquetas/buscar'));
    expect(req1.request.method).toBe('POST');
    expect(req1.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe('2');
    expect(req1.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe('25');
    req1.flush({ result: { success: true }, data: {} });

    service.buscar({ q: 'x' }).subscribe(() => {});
    const req2 = httpMock.expectOne((r) => r.url.includes('/etiquetas/buscar'));
    expect(req2.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe(null);
    expect(req2.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe(null);
    req2.flush({ result: { success: true }, data: {} });
  });

  it('buscarSinGlobalLoader sets skip-loader context', () => {
    service.buscarSinGlobalLoader({ q: 'x' }, 0, 10).subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/etiquetas/buscar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.context.get(NetworkInterceptor.SKIP_GLOBAL_LOADER)).toBe(true);
    req.flush({ result: { success: true }, data: {} });
  });

  it('asociar y desasociar construyen rutas correctas', () => {
    service.asociarConEntrada(1, 2).subscribe(() => {});
    const a1 = httpMock.expectOne((r) => r.url.includes('/etiquetas/asociar'));
    expect(a1.request.method).toBe('POST');
    expect(a1.request.body).toEqual({
      etiquetaId: 1,
      entidadId: 2,
      tipoEntidad: 'ENTRADA',
    });
    a1.flush({ result: { success: true } });

    service.desasociarDeCategoria(3, 4).subscribe(() => {});
    const d1 = httpMock.expectOne((r) => r.url.includes('/etiquetas/desasociar/CATEGORIA/3/4'));
    expect(d1.request.method).toBe('DELETE');
    d1.flush({ result: { success: true } });
  });
});
