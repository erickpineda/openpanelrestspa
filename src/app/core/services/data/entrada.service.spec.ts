import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EntradaService } from './entrada.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';

describe('EntradaService request shapes', () => {
  let service: EntradaService;
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

    service = TestBed.inject(EntradaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listarTiposEntradasSafe maps tiposEntradas', (done) => {
    service.listarTiposEntradasSafe().subscribe((tipos) => {
      expect(tipos.length).toBe(1);
      expect((tipos[0] as any).nombre).toBe('Blog');
      done();
    });

    const req = httpMock.expectOne((r) => r.url.includes('/entradas/tiposEntradas'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: { tiposEntradas: [{ nombre: 'Blog' }] } });
  });

  it('listarEstadosEntradasSafe maps estadosEntradas', (done) => {
    service.listarEstadosEntradasSafe().subscribe((estados) => {
      expect(estados.length).toBe(1);
      expect((estados[0] as any).nombre).toBe('Borrador');
      done();
    });

    const req = httpMock.expectOne((r) => r.url.includes('/entradas/estadosEntradas'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: { estadosEntradas: [{ nombre: 'Borrador' }] } });
  });

  it('buscarSafe posts with skip-loader context and paging params', (done) => {
    service.buscarSafe({ q: 'x' }, 1, 10).subscribe((resp) => {
      expect(resp.totalPages).toBe(2);
      expect(resp.elements.length).toBe(1);
      done();
    });

    const req = httpMock.expectOne((r) => r.url.includes('/entradas/buscar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.context.get(NetworkInterceptor.SKIP_GLOBAL_LOADER)).toBe(true);
    expect(req.request.params.get('pageNo')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('10');
    req.flush({ data: { elements: [{}], totalPages: 2 } });
  });

  it('obtenerDefinicionesBuscadorSafe uses skip-loader context', () => {
    service.obtenerDefinicionesBuscadorSafe().subscribe((resp) => {
      expect(resp).toEqual({ a: 1 });
    });

    const req = httpMock.expectOne((r) => r.url.includes('/entradas/buscar/definicionesBuscador'));
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(NetworkInterceptor.SKIP_GLOBAL_LOADER)).toBe(true);
    req.flush({ data: { a: 1 } });
  });

  it('buscar posts payload and params without forcing skip-loader context', () => {
    service.buscar({ q: 'x' }, 0, 5).subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/entradas/buscar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.context.get(NetworkInterceptor.SKIP_GLOBAL_LOADER)).toBe(false);
    expect(req.request.params.get('pageNo')).toBe('0');
    expect(req.request.params.get('pageSize')).toBe('5');
    req.flush({ result: { success: true }, data: {} });
  });
});
