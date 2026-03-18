import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PrivilegioService } from './privilegio.service';
import { Privilegio } from '../../models/privilegio.model';
import { environment } from '../../../../environments/environment';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';
import { OPConstants } from '../../../shared/constants/op-global.constants';

describe('PrivilegioService', () => {
  let service: PrivilegioService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.backend.host}${environment.backend.uri}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PrivilegioService],
    });
    service = TestBed.inject(PrivilegioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('buscarSinGlobalLoader', () => {
    it('should make a POST request with correct parameters and headers', () => {
      const searchRequest = { term: 'test' };
      const pageNo = 0;
      const pageSize = 10;
      const sortField = 'name';
      const sortDirection = 'ASC';

      service
        .buscarSinGlobalLoader(searchRequest, pageNo, pageSize, sortField, sortDirection)
        .subscribe();

      const req = httpMock.expectOne(
        `${apiUrl}/privilegios/buscar?pageNo=0&pageSize=10&sort=name,ASC`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(searchRequest);
      expect(req.request.context.get(SKIP_GLOBAL_LOADER)).toBeTrue();
      req.flush({});
    });

    it('should default sort direction to ASC if not provided', () => {
      const searchRequest = { term: 'test' };
      const pageNo = 0;
      const pageSize = 10;
      const sortField = 'name';

      service.buscarSinGlobalLoader(searchRequest, pageNo, pageSize, sortField).subscribe();

      const req = httpMock.expectOne(
        `${apiUrl}/privilegios/buscar?pageNo=0&pageSize=10&sort=name,ASC`
      );
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should not add sort param if sortField is not provided', () => {
      const searchRequest = { term: 'test' };
      const pageNo = 0;
      const pageSize = 10;

      service.buscarSinGlobalLoader(searchRequest, pageNo, pageSize).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/privilegios/buscar?pageNo=0&pageSize=10`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('obtenerPorId', () => {
    it('should make a GET request to correct endpoint', () => {
      const id = 'PRIV001';
      service.obtenerPorId(id).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/privilegios/obtenerPorCodigo/${id}`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('actualizar', () => {
    it('should make a PUT request to correct endpoint', () => {
      const id = 'PRIV001';
      const entity: Privilegio = { nombre: 'Test', descripcion: 'Desc' } as Privilegio;

      service.actualizar(id, entity).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/privilegios/actualizarPorCodigo/${id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(entity);
      req.flush({});
    });
  });

  describe('borrar', () => {
    it('should make a DELETE request to correct endpoint', () => {
      const id = 'PRIV001';

      service.borrar(id).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/privilegios/borrarPorCodigo/${id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });
});
