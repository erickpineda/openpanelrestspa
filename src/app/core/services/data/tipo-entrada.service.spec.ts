import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TipoEntradaService } from './tipo-entrada.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

describe('TipoEntradaService', () => {
  let service: TipoEntradaService;
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
    service = TestBed.inject(TipoEntradaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listarPagina usa GET con paginación', () => {
    service.listarPagina(0, 20).subscribe(() => {});
    const req = httpMock.expectOne((r) => r.url.includes(OPConstants.Methods.TIPOS_ENTRADAS.BASE));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe('0');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe('20');
    req.flush({ data: { elements: [] } });
  });

  it('obtenerPorCodigo usa GET correcto', () => {
    service.obtenerPorCodigo('BLOG').subscribe(() => {});
    const req = httpMock.expectOne((r) =>
      r.url.includes(OPConstants.Methods.TIPOS_ENTRADAS.OBTENER_POR_CODIGO('BLOG'))
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });

  it('actualizarPorCodigo usa PUT correcto', () => {
    service.actualizarPorCodigo('BLOG', { nombre: 'Blog' } as any).subscribe(() => {});
    const req = httpMock.expectOne((r) =>
      r.url.includes(OPConstants.Methods.TIPOS_ENTRADAS.ACTUALIZAR_POR_CODIGO('BLOG'))
    );
    expect(req.request.method).toBe('PUT');
    req.flush({ data: {} });
  });

  it('borrarPorCodigo usa DELETE correcto', () => {
    service.borrarPorCodigo('BLOG').subscribe(() => {});
    const req = httpMock.expectOne((r) =>
      r.url.includes(OPConstants.Methods.TIPOS_ENTRADAS.BORRAR_POR_CODIGO('BLOG'))
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({ result: { success: true } });
  });
});

