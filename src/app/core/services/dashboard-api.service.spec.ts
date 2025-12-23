import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { DashboardApiService } from './dashboard-api.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { RolService } from './data/rol.service';
import { PrivilegioService } from './data/privilegio.service';
import { FileStorageService } from './file-storage.service';
import { TokenStorageService } from './auth/token-storage.service';
import { OPConstants } from '../../shared/constants/op-global.constants';
import { NetworkInterceptor } from '../interceptor/network.interceptor';

describe('DashboardApiService force param', () => {
  let service: DashboardApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DashboardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds force=true to summary when forced', () => {
    service.getSummary(true).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/dashboard/summary'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('force')).toBe('true');
    req.flush({ data: {} });
  });

  it('adds force=true to series activity when forced', () => {
    service.getSeriesActivity(30, true, 'day').subscribe();
    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/dashboard/series/activity'),
    );
    expect(req.request.params.get('force')).toBe('true');
    req.flush({ data: [] });
  });

  it('adds force=true to top when forced', () => {
    service.getTop('users', 10, true).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/dashboard/top'));
    expect(req.request.params.get('force')).toBe('true');
    req.flush({ data: [] });
  });
});

describe('Data services request shapes', () => {
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
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('RolService.buscarSinGlobalLoader sets paging params and skip-loader context', () => {
    const service = TestBed.inject(RolService);

    service
      .buscarSinGlobalLoader({ any: 'payload' }, 0, 10)
      .subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/roles/buscar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe(
      '0',
    );
    expect(req.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe(
      '10',
    );
    expect(req.request.context.get(NetworkInterceptor.SKIP_GLOBAL_LOADER)).toBe(
      true,
    );
    req.flush({ data: { elements: [] } });
  });

  it('RolService.obtenerPorCodigos posts payload and paging params', () => {
    const service = TestBed.inject(RolService);

    service.obtenerPorCodigos(['R1', 'R2'], 1, 50).subscribe(() => {});

    const req = httpMock.expectOne((r) =>
      r.url.includes('/roles/obtenerPorCodigos'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ codigosRol: ['R1', 'R2'] });
    expect(req.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe(
      '1',
    );
    expect(req.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe(
      '50',
    );
    req.flush({ data: { elements: [] } });
  });

  it('PrivilegioService.obtenerPorId uses code-based endpoint', () => {
    const service = TestBed.inject(PrivilegioService);

    service.obtenerPorId('P1').subscribe(() => {});

    const req = httpMock.expectOne((r) =>
      r.url.includes('/privilegios/obtenerPorCodigo/P1'),
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: { codigo: 'P1' } });
  });

  it('PrivilegioService.buscarSinGlobalLoader sets paging params and skip-loader context', () => {
    const service = TestBed.inject(PrivilegioService);

    service.buscarSinGlobalLoader({ q: 'x' }, 0, 25).subscribe(() => {});

    const req = httpMock.expectOne((r) =>
      r.url.includes('/privilegios/buscar'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get(OPConstants.Pagination.PAGE_NO_PARAM)).toBe(
      '0',
    );
    expect(req.request.params.get(OPConstants.Pagination.PAGE_SIZE_PARAM)).toBe(
      '25',
    );
    expect(req.request.context.get(NetworkInterceptor.SKIP_GLOBAL_LOADER)).toBe(
      true,
    );
    req.flush({ data: { elements: [] } });
  });

  it('PrivilegioService.crear posts entity to crear endpoint', () => {
    const service = TestBed.inject(PrivilegioService);
    const payload: any = { codigo: 'P1', nombre: 'Priv 1' };

    service.crear(payload).subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/privilegios/crear'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: payload });
  });

  it('PrivilegioService.actualizar uses code-based endpoint', () => {
    const service = TestBed.inject(PrivilegioService);
    const payload: any = { codigo: 'P1', nombre: 'Priv 1 edit' };

    service.actualizar('P1', payload).subscribe(() => {});

    const req = httpMock.expectOne((r) =>
      r.url.includes('/privilegios/actualizarPorCodigo/P1'),
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: payload });
  });

  it('PrivilegioService.borrar uses code-based endpoint', () => {
    const service = TestBed.inject(PrivilegioService);

    service.borrar('P1').subscribe(() => {});

    const req = httpMock.expectOne((r) =>
      r.url.includes('/privilegios/borrarPorCodigo/P1'),
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: 'ok' });
  });
});

describe('FileStorageService request shapes', () => {
  let service: FileStorageService;
  let httpMock: HttpTestingController;
  let tokenStorage: jasmine.SpyObj<TokenStorageService>;

  beforeEach(() => {
    tokenStorage = jasmine.createSpyObj('TokenStorageService', ['getToken']);
    tokenStorage.getToken.and.returnValue('token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: TokenStorageService, useValue: tokenStorage },
      ],
    });
    service = TestBed.inject(FileStorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('descargarFichero sets Authorization header when token exists', () => {
    service.descargarFichero('abc').subscribe(() => {});

    const req = httpMock.expectOne((r) =>
      r.url.includes('/fileStorage/ficheros/descargar/abc'),
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['x']));
  });

  it('uploadFile posts FormData with file', () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    service.uploadFile(file).subscribe(() => {});

    const req = httpMock.expectOne((r) =>
      r.url.includes('/fileStorage/subirFichero'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();

    const body = req.request.body as FormData;
    expect(body.get('file')).toBe(file);
    expect(body.get('folder')).toBeNull();
    req.flush({ data: { ok: true } });
  });

  it('uploadFile includes folder when provided', () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    service.uploadFile(file, 'docs').subscribe(() => {});

    const req = httpMock.expectOne((r) =>
      r.url.includes('/fileStorage/subirFichero'),
    );
    const body = req.request.body as FormData;
    expect(body.get('folder')).toBe('docs');
    req.flush({ data: { ok: true } });
  });

  it('listarFicheros maps response shape to MediaItem list', () => {
    service.listarFicheros(true).subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].uuid).toBe('u1');
      expect(items[0].tipo).toBe('image');
      expect(items[0].url).toBe('/img.jpg');
    });

    const req = httpMock.expectOne((r) =>
      r.url.includes('/fileStorage/ficheros'),
    );
    expect(req.request.context.get(NetworkInterceptor.SKIP_GLOBAL_LOADER)).toBe(
      true,
    );
    req.flush({
      data: [
        {
          uuidFileStorage: 'u1',
          nombre: 'img',
          tipo: 'image/jpeg',
          ruta: '/img.jpg',
          size: 10,
        },
      ],
    });
  });

  it('obtenerDatosFichero returns resp.data when available', () => {
    service.obtenerDatosFichero('u1', true).subscribe((data) => {
      expect(data).toEqual({ uuid: 'u1' });
    });

    const req = httpMock.expectOne((r) =>
      r.url.includes('/fileStorage/ficheros/obtenerDatos/u1'),
    );
    expect(req.request.context.get(NetworkInterceptor.SKIP_GLOBAL_LOADER)).toBe(
      true,
    );
    req.flush({ data: { uuid: 'u1' } });
  });

  it('listMedia sends expected query params', () => {
    service.listMedia('file', 2, 15).subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/media'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('type')).toBe('file');
    expect(req.request.params.get('pageNo')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('15');
    req.flush({ data: [] });
  });

  it('deleteMedia encodes id in URL', () => {
    service.deleteMedia('a b').subscribe(() => {});

    const req = httpMock.expectOne((r) => r.url.includes('/media/a%20b'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: true });
  });
});
