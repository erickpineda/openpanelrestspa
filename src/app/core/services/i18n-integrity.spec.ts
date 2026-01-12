import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslationService } from './translation.service';
import { LanguageService } from './language.service';

describe('Sistema de Internacionalización (I18N)', () => {
  let translationService: TranslationService;
  let languageService: LanguageService;
  let httpMock: HttpTestingController;

  const mockEs = {
    "MENU": {
      "HOME": "Inicio"
    },
    "AUTO": {
      "HELLO": "Hola"
    }
  };

  const mockEn = {
    "MENU": {
      "HOME": "Home"
    },
    "AUTO": {
      "HELLO": "Hello"
    }
  };

  beforeEach(() => {
    // Limpiar localStorage antes de cada test para probar detección
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TranslationService, LanguageService]
    });

    translationService = TestBed.inject(TranslationService);
    languageService = TestBed.inject(LanguageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debe iniciar con el idioma por defecto (es) si no hay nada guardado', () => {
    // Simular respuesta inicial
    const req = httpMock.expectOne('assets/i18n/es.json');
    req.flush(mockEs);

    expect(languageService.getCurrentLanguage()).toBe('es');
  });

  it('debe cargar las traducciones y traducir una clave', () => {
    // Carga inicial (es)
    const req = httpMock.expectOne('assets/i18n/es.json');
    req.flush(mockEs);

    expect(translationService.translate('MENU.HOME')).toBe('Inicio');
    expect(translationService.translate('AUTO.HELLO')).toBe('Hola');
  });

  it('debe cambiar de idioma y actualizar traducciones', () => {
    // Carga inicial (es)
    const reqEs = httpMock.expectOne('assets/i18n/es.json');
    reqEs.flush(mockEs);

    // Cambiar a inglés
    languageService.setLanguage('en');

    // Debe pedir en.json
    const reqEn = httpMock.expectOne('assets/i18n/en.json');
    reqEn.flush(mockEn);

    expect(languageService.getCurrentLanguage()).toBe('en');
    expect(translationService.translate('MENU.HOME')).toBe('Home');
  });

  it('debe usar fallback (clave) si no encuentra la traducción', () => {
    // Carga inicial (es)
    const req = httpMock.expectOne('assets/i18n/es.json');
    req.flush(mockEs);

    expect(translationService.translate('MISSING.KEY')).toBe('MISSING.KEY');
  });

  it('debe interpolar parámetros correctamente', () => {
     // Carga inicial
     const req = httpMock.expectOne('assets/i18n/es.json');
     req.flush({ "GREETING": "Hola {{name}}" });

     expect(translationService.translate('GREETING', { name: 'Juan' })).toBe('Hola Juan');
  });
});
