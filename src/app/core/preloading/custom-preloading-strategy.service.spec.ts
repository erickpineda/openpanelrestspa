import { CustomPreloadingStrategyService } from './custom-preloading-strategy.service';
import { of } from 'rxjs';

describe('CustomPreloadingStrategyService', () => {
  let service: CustomPreloadingStrategyService;

  beforeEach(() => {
    const tokenStorage: any = { isLoggedIn: () => true };
    service = new CustomPreloadingStrategyService(tokenStorage);
  });

  it('no preloads when data.preload is false or missing', (done) => {
    const route: any = { path: 'test' };
    let loaded = false;
    service.preload(route, () => { loaded = true; return of('loaded'); }).subscribe(res => {
      expect(res).toBeNull();
      expect(loaded).toBeFalse();
      done();
    });
  });

  it('preloads after delay when data.preload is true', (done) => {
    const route: any = { path: 'entradas', data: { preload: true, delay: 10 } };
    let called = false;
    service.preload(route, () => { called = true; return of('ok'); }).subscribe(res => {
      expect(called).toBeTrue();
      expect(res).toBe('ok');
      done();
    });
  });

  it('does not preload protected route when not logged in', (done) => {
    const tokenStorage: any = { isLoggedIn: () => false };
    service = new CustomPreloadingStrategyService(tokenStorage);
    const route: any = { path: 'admin', data: { preload: true, delay: 10 }, canLoad: [{}] };
    let called = false;
    service.preload(route, () => { called = true; return of('ok'); }).subscribe(res => {
      expect(res).toBeNull();
      expect(called).toBeFalse();
      done();
    });
  });
});
