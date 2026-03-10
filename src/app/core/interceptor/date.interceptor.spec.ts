import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { DateInterceptor } from './date.interceptor';
import { formatForBackend } from '../../shared/utils/date-utils';

describe('DateInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: DateInterceptor,
          multi: true,
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe interceptar peticiones POST y formatear fechas', () => {
    const date = new Date('2025-01-01T12:00:00Z');
    const expectedFormat = formatForBackend(date);

    httpClient.post('/api/test', { dateField: date }).subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.body.dateField).toBe(expectedFormat);
    req.flush({});
  });

  it('debe interceptar peticiones PUT y formatear fechas en strings ISO', () => {
    const isoString = '2025-01-01T12:00:00.000Z';
    const expectedFormat = formatForBackend(isoString);

    httpClient.put('/api/test', { dateField: isoString }).subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.body.dateField).toBe(expectedFormat);
    req.flush({});
  });

  it('no debe modificar peticiones GET', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('no debe modificar FormData', () => {
    const formData = new FormData();
    formData.append('key', 'value');

    httpClient.post('/api/upload', formData).subscribe();

    const req = httpMock.expectOne('/api/upload');
    expect(req.request.body).toBe(formData);
    req.flush({});
  });

  it('debe procesar objetos anidados', () => {
    const date = new Date('2025-01-01T10:00:00Z');
    const expectedFormat = formatForBackend(date);
    const body = {
      nested: {
        dateField: date,
      },
    };

    httpClient.post('/api/nested', body).subscribe();

    const req = httpMock.expectOne('/api/nested');
    expect(req.request.body.nested.dateField).toBe(expectedFormat);
    req.flush({});
  });

  it('debe procesar arrays', () => {
    const date = new Date('2025-01-01T10:00:00Z');
    const expectedFormat = formatForBackend(date);
    const body = [date, { dateField: date }];

    httpClient.post('/api/array', body).subscribe();

    const req = httpMock.expectOne('/api/array');
    expect(req.request.body[0]).toBe(expectedFormat);
    expect(req.request.body[1].dateField).toBe(expectedFormat);
    req.flush({});
  });
});
