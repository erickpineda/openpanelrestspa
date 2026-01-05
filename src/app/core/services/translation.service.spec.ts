import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslationService } from './translation.service';
import { LanguageService } from './language.service';
import { LoggerService } from './logger.service';
import { BehaviorSubject } from 'rxjs';

describe('TranslationService', () => {
  let service: TranslationService;
  let httpMock: HttpTestingController;
  let languageServiceMock: any;

  beforeEach(() => {
    languageServiceMock = {
      currentLang$: new BehaviorSubject('es'),
      getCurrentLanguage: () => 'es'
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TranslationService,
        { provide: LanguageService, useValue: languageServiceMock },
        LoggerService
      ]
    });

    service = TestBed.inject(TranslationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    // Expect request for default language 'es'
    const req = httpMock.expectOne('assets/i18n/es.json');
    req.flush({ "WELCOME": "Hola" });
    expect(service).toBeTruthy();
  });

  it('should load translations for default language', () => {
    const req = httpMock.expectOne('assets/i18n/es.json');
    req.flush({ "WELCOME": "Hola" });
    
    expect(service.translate('WELCOME')).toBe('Hola');
  });

  it('should interpolate parameters', () => {
    const req = httpMock.expectOne('assets/i18n/es.json');
    req.flush({ "GREETING": "Hola {{name}}" });

    expect(service.translate('GREETING', { name: 'Mundo' })).toBe('Hola Mundo');
  });

  it('should use fallback if key not found in current language', () => {
    // 1. Carga inicial default (es)
    const reqEs = httpMock.expectOne('assets/i18n/es.json');
    reqEs.flush({ "ONLY_IN_ES": "Solo en Español", "COMMON": "Común ES" });

    // 2. Cambiar idioma a 'en'
    languageServiceMock.currentLang$.next('en');
    
    // 3. Se espera carga de 'en'
    const reqEn = httpMock.expectOne('assets/i18n/en.json');
    reqEn.flush({ "COMMON": "Common EN" });

    // Verificar traducción existente en EN
    expect(service.translate('COMMON')).toBe('Common EN');
    
    // Verificar fallback a ES
    expect(service.translate('ONLY_IN_ES')).toBe('Solo en Español');
  });

  it('should return key if translation missing in both', () => {
    const req = httpMock.expectOne('assets/i18n/es.json');
    req.flush({});
    
    expect(service.translate('MISSING.KEY')).toBe('MISSING.KEY');
  });

  it('should handle nested keys', () => {
    const req = httpMock.expectOne('assets/i18n/es.json');
    req.flush({ 
      "HOME": {
        "TITLE": "Inicio"
      }
    });

    expect(service.translate('HOME.TITLE')).toBe('Inicio');
  });
});
