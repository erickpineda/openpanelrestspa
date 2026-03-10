import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { LanguageInterceptor } from './language.interceptor';
import { LanguageService } from '../services/language.service';

describe('LanguageInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let languageServiceSpy: jasmine.SpyObj<LanguageService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('LanguageService', ['getCurrentLanguage']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: LanguageInterceptor,
          multi: true,
        },
        { provide: LanguageService, useValue: spy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    languageServiceSpy = TestBed.inject(LanguageService) as jasmine.SpyObj<LanguageService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe agregar el parámetro lang a las peticiones /api/', () => {
    languageServiceSpy.getCurrentLanguage.and.returnValue('en');

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne((req) => req.url === '/api/test');
    expect(req.request.params.has('lang')).toBeTrue();
    expect(req.request.params.get('lang')).toBe('en');
    req.flush({});
  });

  it('no debe agregar el parámetro lang a peticiones que no son /api/', () => {
    languageServiceSpy.getCurrentLanguage.and.returnValue('en');

    httpClient.get('/other/resource').subscribe();

    const req = httpMock.expectOne('/other/resource');
    expect(req.request.params.has('lang')).toBeFalse();
    req.flush({});
  });

  it('debe usar el idioma actual del servicio', () => {
    languageServiceSpy.getCurrentLanguage.and.returnValue('es');

    httpClient.get('/api/data').subscribe();

    const req = httpMock.expectOne((req) => req.url === '/api/data');
    expect(req.request.params.get('lang')).toBe('es');
    req.flush({});
  });
});
