import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { AuthSyncService } from './auth-sync.service';
import { SessionManagerService } from './session-manager.service';

function createJwt(expSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const payload = btoa(JSON.stringify({ exp: expSeconds }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${header}.${payload}.`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenStorage: jasmine.SpyObj<TokenStorageService>;
  let authSync: jasmine.SpyObj<AuthSyncService>;
  let sessionManager: jasmine.SpyObj<SessionManagerService>;

  beforeEach(() => {
    tokenStorage = jasmine.createSpyObj('TokenStorageService', [
      'getUser',
      'cleanExpiredPostLoginRedirects',
      'startPostLoginRedirectMaintenance',
      'saveToken',
      'saveUser',
      'getToken',
      'getOrCreateTabId',
      'signOut',
    ]);
    tokenStorage.getUser.and.returnValue(null);
    tokenStorage.getToken.and.returnValue('t');
    tokenStorage.getOrCreateTabId.and.returnValue('tab');

    authSync = jasmine.createSpyObj('AuthSyncService', [
      'notifyLogin',
      'notifyLogout',
    ]);
    sessionManager = jasmine.createSpyObj('SessionManagerService', [
      'performLogout',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: TokenStorageService, useValue: tokenStorage },
        { provide: AuthSyncService, useValue: authSync },
        { provide: SessionManagerService, useValue: sessionManager },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('login guarda token y notifica login', (done) => {
    const userData = { jwttoken: 'jwt', username: 'u' };

    service.user$.subscribe((user) => {
      if (user) {
        expect(user.username).toBe('u');
        done();
      }
    });

    service.login('u', 'p').subscribe(() => {
      expect(tokenStorage.saveToken).toHaveBeenCalledWith('jwt');
      expect(tokenStorage.saveUser).toHaveBeenCalledWith(userData as any);
      expect(authSync.notifyLogin).toHaveBeenCalled();
    });

    const req = httpMock.expectOne((r) => r.url.includes('/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'u', password: 'p' });
    req.flush(userData);
  });

  it('logout llama a performLogout tras respuesta', () => {
    service.logout().subscribe(() => {
      expect(sessionManager.performLogout).toHaveBeenCalled();
      expect(authSync.notifyLogout).toHaveBeenCalled();
    });

    const req = httpMock.expectOne((r) => r.url.includes('/auth/logout'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer t');
    req.flush({});
  });

  it('isTokenValid usa tokenStorage y calcula expiración', () => {
    tokenStorage.getToken.and.returnValue(null);
    expect(service.isTokenValid()).toBeFalse();

    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    tokenStorage.getToken.and.returnValue(createJwt(futureExp));
    expect(service.isTokenValid()).toBeTrue();
  });

  it('ensureTokenValidOnInit no actúa sin token y llama a forceLogout si expira', () => {
    tokenStorage.getToken.and.returnValue(null);
    service.ensureTokenValidOnInit();

    const pastExp = Math.floor(Date.now() / 1000) - 10;
    tokenStorage.getToken.and.returnValue(createJwt(pastExp));
    const spy = spyOn(service, 'forceLogoutDueToExpiredToken');
    service.ensureTokenValidOnInit();
    expect(spy).toHaveBeenCalled();
  });
});
