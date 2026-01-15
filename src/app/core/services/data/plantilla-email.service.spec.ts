import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { PlantillaEmailService } from './plantilla-email.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

describe('PlantillaEmailService', () => {
  let service: PlantillaEmailService;
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
    service = TestBed.inject(PlantillaEmailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('obtenerPorCodigo usa GET correcto', () => {
    service.obtenerPorCodigo('RESET_PASS').subscribe(() => {});
    const req = httpMock.expectOne((r) =>
      r.url.includes(OPConstants.Methods.PLANTILLA_EMAIL.OBTENER_POR_CODIGO('RESET_PASS'))
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });

  it('borrarPorCodigo usa DELETE correcto', () => {
    service.borrarPorCodigo('RESET_PASS').subscribe(() => {});
    const req = httpMock.expectOne((r) =>
      r.url.includes(OPConstants.Methods.PLANTILLA_EMAIL.BORRAR_POR_CODIGO('RESET_PASS'))
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({ result: { success: true }, data: 'plantilla.mensaje.borrado.ok' });
  });
});

