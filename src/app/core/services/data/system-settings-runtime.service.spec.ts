import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SystemSettingsRuntimeService } from './system-settings-runtime.service';

describe('SystemSettingsRuntimeService', () => {
  let service: SystemSettingsRuntimeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
    });

    service = TestBed.inject(SystemSettingsRuntimeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('carga los ajustes públicos mínimos y los deja disponibles para lectura síncrona', () => {
    service.loadPublicSettings().subscribe();

    const reqs = httpMock.match((request) =>
      request.url.includes('/config/ajustes/publico/clave/')
    );

    expect(reqs.length).toBe(5);

    const byKey = (suffix: string) =>
      reqs.find((req) => req.request.url.endsWith(encodeURIComponent(suffix)));

    expect(byKey('site.name')).toBeTruthy();
    expect(byKey('site.description')).toBeTruthy();
    expect(byKey('comments.enabled')).toBeTruthy();
    expect(byKey('listings.entries.defaultPageSize')).toBeTruthy();
    expect(byKey('integrations.social.share.enabled')).toBeTruthy();

    byKey('site.name')?.flush({ data: { clave: 'site.name', valor: 'Mi portal' } });
    byKey('site.description')?.flush({
      data: { clave: 'site.description', valor: 'Descripción pública' },
    });
    byKey('comments.enabled')?.flush({ data: { clave: 'comments.enabled', valor: 'true' } });
    byKey('listings.entries.defaultPageSize')?.flush({
      data: { clave: 'listings.entries.defaultPageSize', valor: '12' },
    });
    byKey('integrations.social.share.enabled')?.flush({
      data: { clave: 'integrations.social.share.enabled', valor: 'false' },
    });

    expect(service.getString('site.name', 'OpenPanel')).toBe('Mi portal');
    expect(service.getString('site.description', 'Fallback')).toBe('Descripción pública');
    expect(service.getBoolean('comments.enabled', false)).toBeTrue();
    expect(service.getNumber('listings.entries.defaultPageSize', 10)).toBe(12);
    expect(service.getBoolean('integrations.social.share.enabled', true)).toBeFalse();
  });

  it('devuelve fallback cuando la clave no existe o no trae valor usable', () => {
    service.loadPublicSettings().subscribe();

    const reqs = httpMock.match((request) =>
      request.url.includes('/config/ajustes/publico/clave/')
    );

    reqs.forEach((req) => req.flush({ data: null }));

    expect(service.getString('site.name', 'OpenPanel')).toBe('OpenPanel');
    expect(service.getBoolean('comments.enabled', true)).toBeTrue();
    expect(service.getNumber('listings.entries.defaultPageSize', 10)).toBe(10);
  });

  it('usa fallback seguro cuando el parseo numérico falla', () => {
    service.loadPublicSettings().subscribe();

    const reqs = httpMock.match((request) =>
      request.url.includes('/config/ajustes/publico/clave/')
    );

    reqs.forEach((req) => {
      const url = req.request.url;
      if (url.endsWith(encodeURIComponent('listings.entries.defaultPageSize'))) {
        req.flush({ data: { valor: 'no-num' } });
        return;
      }
      req.flush({ data: null });
    });

    expect(service.getNumber('listings.entries.defaultPageSize', 24)).toBe(24);
  });

  it('usa fallback seguro cuando el parseo booleano falla', () => {
    service.loadPublicSettings().subscribe();

    const reqs = httpMock.match((request) =>
      request.url.includes('/config/ajustes/publico/clave/')
    );

    reqs.forEach((req) => {
      const url = req.request.url;
      if (url.endsWith(encodeURIComponent('comments.enabled'))) {
        req.flush({ data: { valor: 'tal vez' } });
        return;
      }
      req.flush({ data: null });
    });

    expect(service.getBoolean('comments.enabled', false)).toBeFalse();
  });
});
