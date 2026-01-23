import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CrudService } from './crud.service';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { OPConstants } from '../../shared/constants/op-global.constants';
import { SKIP_GLOBAL_LOADER } from '../interceptor/network.interceptor';

class TestCrudService extends CrudService<any, string> {
  protected override endpoint = '/things';
}

describe('CrudService base behaviors', () => {
  let service: TestCrudService;
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

    const http = TestBed.inject(HttpClient);
    const tokenStorage = TestBed.inject(TokenStorageService);
    service = new TestCrudService(http, tokenStorage);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listarSafe agrega paginación solo si se pasa', (done) => {
    service.listarSafe(1).subscribe((items) => {
      expect(items).toEqual([]);
      done();
    });

    const req = httpMock.expectOne((r) => r.url.includes('/things'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe('1');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe(null);
    req.flush({ data: { elements: [] } });
  });

  it('listarSafeSinGlobalLoader establece contexto skip-loader', () => {
    service.listarSafeSinGlobalLoader(0, 10).subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/things'));
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(SKIP_GLOBAL_LOADER)).toBe(true);
    req.flush({ data: { elements: [] } });
  });

  it('crearConEstado mapea success y data', (done) => {
    service.crearConEstado({ a: 1 }).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data).toEqual({ id: '1' });
      done();
    });

    const req = httpMock.expectOne((r) => r.url.includes('/things/crear'));
    expect(req.request.method).toBe('POST');
    req.flush({ result: { success: true }, data: { id: '1' } });
  });

  it('eliminarSafe devuelve false ante error HTTP', (done) => {
    service.eliminarSafe('x').subscribe((ok) => {
      expect(ok).toBe(false);
      done();
    });

    const req = httpMock.expectOne((r) => r.url.includes('/things/x'));
    expect(req.request.method).toBe('DELETE');
    req.flush('x', { status: 500, statusText: 'Server Error' });
  });
});
