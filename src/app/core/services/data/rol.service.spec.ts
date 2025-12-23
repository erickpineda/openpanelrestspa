import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { RolService } from './rol.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';

describe('RolService request shapes', () => {
  let service: RolService;
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

    service = TestBed.inject(RolService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('buscarSinGlobalLoader adjunta params y contexto', () => {
    service.buscarSinGlobalLoader({ q: 'x' }, 2, 25).subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/roles/buscar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe(
      '2',
    );
    expect(req.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe(
      '25',
    );
    expect(req.request.context.get(NetworkInterceptor.SKIP_GLOBAL_LOADER)).toBe(
      true,
    );
    req.flush({ data: { elements: [], totalPages: 0 } });
  });

  it('obtenerPrivilegios hace GET con código', () => {
    service.obtenerPrivilegios('R1').subscribe(() => {});
    const req = httpMock.expectOne((r) =>
      r.url.includes('/roles/obtenerPrivilegios/R1'),
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });

  it('obtenerPorCodigos hace POST con payload y paginación por defecto', () => {
    service.obtenerPorCodigos(['A', 'B']).subscribe(() => {});
    const req = httpMock.expectOne((r) =>
      r.url.includes('/roles/obtenerPorCodigos'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ codigosRol: ['A', 'B'] });
    expect(req.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe(
      '0',
    );
    expect(req.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe(
      '50',
    );
    req.flush({ data: { elements: [], totalPages: 0 } });
  });

  it('override endpoints por código', () => {
    service.obtenerPorId('R1').subscribe(() => {});
    const getReq = httpMock.expectOne((r) =>
      r.url.includes('/roles/obtenerPorCodigo/R1'),
    );
    expect(getReq.request.method).toBe('GET');
    getReq.flush({ data: {} });

    service.actualizar('R1', { codigo: 'R1' } as any).subscribe(() => {});
    const putReq = httpMock.expectOne((r) =>
      r.url.includes('/roles/actualizarPorCodigo/R1'),
    );
    expect(putReq.request.method).toBe('PUT');
    putReq.flush({ data: {} });

    service.borrar('R1').subscribe(() => {});
    const delReq = httpMock.expectOne((r) =>
      r.url.includes('/roles/borrarPorCodigo/R1'),
    );
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({ result: { success: true } });
  });

  it('safe overrides mapean data y success', (done) => {
    service.obtenerPorIdSafe('R2').subscribe((rol) => {
      expect((rol as any).codigo).toBe('R2');
      done();
    });
    const req = httpMock.expectOne((r) =>
      r.url.includes('/roles/obtenerPorCodigo/R2'),
    );
    req.flush({ data: { codigo: 'R2' } });
  });

  it('eliminarSafe devuelve true cuando el backend confirma', (done) => {
    service.eliminarSafe('R3').subscribe((ok) => {
      expect(ok).toBe(true);
      done();
    });

    const req = httpMock.expectOne((r) =>
      r.url.includes('/roles/borrarPorCodigo/R3'),
    );
    req.flush({ result: { success: true } });
  });
});
