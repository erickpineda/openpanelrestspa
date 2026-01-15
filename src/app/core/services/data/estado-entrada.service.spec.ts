import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EstadoEntradaService } from './estado-entrada.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

describe('EstadoEntradaService', () => {
  let service: EstadoEntradaService;
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
    service = TestBed.inject(EstadoEntradaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('obtenerPorCodigo usa GET correcto', () => {
    service.obtenerPorCodigo('PUBLICADO').subscribe(() => {});
    const req = httpMock.expectOne((r) =>
      r.url.includes(OPConstants.Methods.ESTADOS_ENTRADAS.OBTENER_POR_CODIGO('PUBLICADO'))
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });

  it('borrarPorCodigo usa DELETE correcto', () => {
    service.borrarPorCodigo('PUBLICADO').subscribe(() => {});
    const req = httpMock.expectOne((r) =>
      r.url.includes(OPConstants.Methods.ESTADOS_ENTRADAS.BORRAR_POR_CODIGO('PUBLICADO'))
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({ result: { success: true } });
  });
});

