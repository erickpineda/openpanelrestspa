import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AgraviosService } from './agravios.service';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';
import { environment } from '../../../../environments/environment';

describe('AgraviosService', () => {
  let service: AgraviosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AgraviosService],
    });
    service = TestBed.inject(AgraviosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('obtenerPorPalabra should make a GET request', () => {
    const palabra = 'test';
    const mockResponse = { data: [] };

    service.obtenerPorPalabra(palabra).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const expectedUrl = `${environment.backend.host}${environment.backend.uri}${OPConstants.Methods.AGRAVIOS.OBTENER_POR_PALABRA(palabra)}`;
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
