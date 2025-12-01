import { CustomPreloadingStrategyService } from './custom-preloading-strategy.service';
import { of } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';

describe('CustomPreloadingStrategyService', () => {
  let service: CustomPreloadingStrategyService;

  beforeEach(() => {
    service = new CustomPreloadingStrategyService();
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
});

