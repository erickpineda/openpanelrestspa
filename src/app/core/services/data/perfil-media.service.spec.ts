import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PerfilMediaService } from './perfil-media.service';

describe('PerfilMediaService', () => {
  let service: PerfilMediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
    });

    service = TestBed.inject(PerfilMediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sube avatar al endpoint de perfil', () => {
    const file = new File(['x'], 'avatar.png', { type: 'image/png' });

    service.uploadAvatar(file).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url.includes('/usuarios/perfil/imagen') && request.method === 'POST'
    );
    expect(req.request.body instanceof FormData).toBeTrue();
    expect((req.request.body as FormData).get('file')).toBe(file);

    req.flush({ data: { uuid: 'avatar-1' } });
  });

  it('borra avatar en el endpoint dedicado de perfil', () => {
    service.deleteAvatar().subscribe((response) => {
      expect(response).toBe('avatar borrado');
    });

    const req = httpMock.expectOne(
      (request) => request.url.includes('/usuarios/perfil/imagen') && request.method === 'DELETE'
    );
    req.flush({ data: 'avatar borrado' });
  });
});
