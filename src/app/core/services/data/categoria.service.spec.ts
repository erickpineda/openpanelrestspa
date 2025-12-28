import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CategoriaService } from './categoria.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';

describe('CategoriaService request shapes', () => {
  let service: CategoriaService;
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

    service = TestBed.inject(CategoriaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('buscarSafe posts payload and paging params', () => {
    service.buscarSafe({ q: 'x' }, 1, 20).subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/categorias/buscar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe('1');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe('20');
    expect(req.request.body).toEqual({ q: 'x' });
    req.flush({ data: { elements: [], totalPages: 0 } });
  });

  it('buscarSinGlobalLoader sets skip-loader context', () => {
    service.buscarSinGlobalLoader({ q: 'x' }, 0, 10).subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/categorias/buscar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.context.get(NetworkInterceptor.SKIP_GLOBAL_LOADER)).toBe(true);
    req.flush({ data: { elements: [], totalPages: 0 } });
  });
});
