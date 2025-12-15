import { CustomPreloadingStrategyService } from './custom-preloading-strategy.service';
import { of } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';

describe('CustomPreloadingStrategyService', () => {
  let service: CustomPreloadingStrategyService;

  beforeEach(() => {
    const tokenStorage: any = { isLoggedIn: () => true };
    service = new CustomPreloadingStrategyService(tokenStorage);
  });

  it('no preloads when data.preload is false or missing', fakeAsync(() => {
    const route: any = { path: 'test' };
    let loaded = false;
    service.preload(route, () => { loaded = true; return of('loaded'); }).subscribe(res => {
      expect(res).toBeNull();
    });
    expect(loaded).toBeFalse();
  }));

  it('preloads after delay when data.preload is true', fakeAsync(() => {
    const route: any = { path: 'entradas', data: { preload: true, delay: 500 } };
    let called = false;
    let result: any;
    service.preload(route, () => { called = true; return of('ok'); }).subscribe(res => { result = res; });
    expect(called).toBeFalse();
    tick(500);
    expect(called).toBeTrue();
    expect(result).toBe('ok');
  }));

  it('does not preload protected route when not logged in', fakeAsync(() => {
    const tokenStorage: any = { isLoggedIn: () => false };
    service = new CustomPreloadingStrategyService(tokenStorage);
    const route: any = { path: 'admin', data: { preload: true, delay: 300 }, canLoad: [{}] };
    let called = false;
    service.preload(route, () => { called = true; return of('ok'); }).subscribe(res => {
      expect(res).toBeNull();
    });
    tick(300);
    expect(called).toBeFalse();
  }));
});
