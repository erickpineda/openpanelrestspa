import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComentarioService } from './comentario.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

describe('ComentarioService listarPorIdEntrada', () => {
  let service: ComentarioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: TokenStorageService,
          useValue: { getToken: () => null },
        },
      ],
    });
    service = TestBed.inject(ComentarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('usa GET con paging y ruta listarPorIdEntrada', () => {
    service.listarPorIdEntrada(77, 0, 20).subscribe(() => {});
    const req = httpMock.expectOne((r) =>
      r.url.includes(OPConstants.Methods.COMENTARIOS.LISTAR_POR_ID_ENTRADA(77))
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe('0');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe('20');
    req.flush({ data: { elements: [], totalPages: 0 } });
  });
});
