import { Subject } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { RouteTrackerService } from './route-tracker.service';

describe('RouteTrackerService', () => {
  beforeEach(() => {
    (RouteTrackerService as any).lastValidUrl = null;
  });

  it('no guarda rutas públicas o de login', () => {
    const events$ = new Subject<any>();
    const router: any = { events: events$.asObservable() };
    const tokenStorage: any = { isLoggedIn: () => true };
    const log = jasmine.createSpyObj('LoggerService', ['info', 'error']);
    const postLoginRedirect = jasmine.createSpyObj('PostLoginRedirectService', [
      'shouldIgnoreRouteSave',
      'saveLastValidRoute',
    ]);
    postLoginRedirect.shouldIgnoreRouteSave.and.returnValue(false);

    new RouteTrackerService(router, tokenStorage, log, postLoginRedirect);

    events$.next(new NavigationEnd(1, '/login', '/login'));
    events$.next(new NavigationEnd(1, '/public/about', '/public/about'));

    expect(postLoginRedirect.saveLastValidRoute).not.toHaveBeenCalled();
    expect(RouteTrackerService.getLastValidUrl()).toBeNull();
  });

  it('guarda última ruta válida cuando autenticado', () => {
    const events$ = new Subject<any>();
    const router: any = { events: events$.asObservable() };
    const tokenStorage: any = { isLoggedIn: () => true };
    const log = jasmine.createSpyObj('LoggerService', ['info', 'error']);
    const postLoginRedirect = jasmine.createSpyObj('PostLoginRedirectService', [
      'shouldIgnoreRouteSave',
      'saveLastValidRoute',
    ]);
    postLoginRedirect.shouldIgnoreRouteSave.and.returnValue(false);

    new RouteTrackerService(router, tokenStorage, log, postLoginRedirect);
    events$.next(new NavigationEnd(1, '/admin/a', '/admin/a'));

    expect(postLoginRedirect.saveLastValidRoute).toHaveBeenCalledWith('/admin/a');
    expect(RouteTrackerService.getLastValidUrl()).toBe('/admin/a');
  });

  it('no guarda si usuario no autenticado o si debe ignorarse', () => {
    const events$ = new Subject<any>();
    const router: any = { events: events$.asObservable() };
    const tokenStorage: any = { isLoggedIn: () => false };
    const log = jasmine.createSpyObj('LoggerService', ['info', 'error']);
    const postLoginRedirect = jasmine.createSpyObj('PostLoginRedirectService', [
      'shouldIgnoreRouteSave',
      'saveLastValidRoute',
    ]);
    postLoginRedirect.shouldIgnoreRouteSave.and.returnValue(false);

    new RouteTrackerService(router, tokenStorage, log, postLoginRedirect);
    events$.next(new NavigationEnd(1, '/admin/a', '/admin/a'));
    expect(postLoginRedirect.saveLastValidRoute).not.toHaveBeenCalled();

    tokenStorage.isLoggedIn = () => true;
    postLoginRedirect.shouldIgnoreRouteSave.and.returnValue(true);
    events$.next(new NavigationEnd(1, '/admin/b', '/admin/b'));
    expect(postLoginRedirect.saveLastValidRoute).not.toHaveBeenCalled();
  });

  it('captura errores durante guardado', () => {
    const events$ = new Subject<any>();
    const router: any = { events: events$.asObservable() };
    const tokenStorage: any = { isLoggedIn: () => true };
    const log = jasmine.createSpyObj('LoggerService', ['info', 'error']);
    const postLoginRedirect = jasmine.createSpyObj('PostLoginRedirectService', [
      'shouldIgnoreRouteSave',
      'saveLastValidRoute',
    ]);
    postLoginRedirect.shouldIgnoreRouteSave.and.returnValue(false);
    postLoginRedirect.saveLastValidRoute.and.throwError('boom');

    new RouteTrackerService(router, tokenStorage, log, postLoginRedirect);
    events$.next(new NavigationEnd(1, '/admin/a', '/admin/a'));

    expect(log.error).toHaveBeenCalled();
  });
});
