import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EntradaService } from './entrada.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

describe('EntradaService obtenerPorSlug', () => {
  let service: EntradaService;
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
    service = TestBed.inject(EntradaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('usa GET con la ruta obtenerPorSlug', () => {
    service.obtenerPorSlug('mi-slug').subscribe(() => {});
    const req = httpMock.expectOne((r) =>
      r.url.includes(OPConstants.Methods.ENTRADAS.OBTENER_POR_SLUG('mi-slug'))
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });
});

