import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { UiAnomalyMonitorService } from './ui-anomaly-monitor.service';
import { LoggerService } from '../logger.service';
import { LoadingService } from './loading.service';

describe('UiAnomalyMonitorService', () => {
  let service: UiAnomalyMonitorService;
  let events$: Subject<any>;
  let router: any;
  let log: jasmine.SpyObj<LoggerService>;
  let loading: jasmine.SpyObj<LoadingService>;

  beforeEach(() => {
    jasmine.clock().install();
    events$ = new Subject<any>();
    router = { events: events$.asObservable() };
    log = jasmine.createSpyObj<LoggerService>('LoggerService', ['warn', 'debug', 'info', 'error']);
    loading = jasmine.createSpyObj<LoadingService>('LoadingService', [
      'getLoadingStats',
      'forceStopLoading',
    ]);
    loading.getLoadingStats.and.returnValue({
      activeRequests: 0,
      trackedRequests: 0,
      isLoading: false,
    });

    try {
      localStorage.removeItem('op_ui_anomaly_snapshots_v1');
      localStorage.removeItem('op_ui_anomaly_monitor_config_v1');
    } catch {}

    TestBed.configureTestingModule({
      providers: [
        UiAnomalyMonitorService,
        { provide: Router, useValue: router },
        { provide: LoggerService, useValue: log },
        { provide: LoadingService, useValue: loading },
        {
          provide: NgZone,
          useValue: {
            runOutsideAngular: (fn: any) => fn(),
            run: (fn: any) => fn(),
          },
        },
      ],
    });

    service = TestBed.inject(UiAnomalyMonitorService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    document
      .querySelectorAll(
        '.modal,.offcanvas,[role="dialog"],[aria-modal="true"],.modal-backdrop,.offcanvas-backdrop,.c-backdrop,.loading-overlay.full-screen,.mobile-overlay'
      )
      .forEach((n) => {
        try {
          n.remove();
        } catch {}
      });
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  it('start programa escaneo periódico y reacciona a NavigationEnd', () => {
    const scanSpy = spyOn(service, 'scanAndRecover').and.callThrough();

    service.setConfig({ enabled: true }, false);
    service.start();
    events$.next(new NavigationEnd(1, '/x', '/x'));

    jasmine.clock().tick(1000); // Wait for navigation debounce (500ms) + buffer
    expect(scanSpy).toHaveBeenCalledWith('navigation');

    jasmine.clock().tick(600); // +600 = 1600 total (1500 interval + 100 margin)
    expect(scanSpy).toHaveBeenCalledWith('interval');

    const callsAfterTick = scanSpy.calls.count();
    service.stop();
    jasmine.clock().tick(3000);
    expect(scanSpy.calls.count()).toBe(callsAfterTick);
  });

  it('start no programa escaneo si está desactivado', () => {
    const scanSpy = spyOn(service, 'scanAndRecover').and.callThrough();
    service.setConfig({ enabled: false }, false);

    service.start();
    events$.next(new NavigationEnd(1, '/x', '/x'));
    jasmine.clock().tick(2000);

    expect(scanSpy).not.toHaveBeenCalled();
  });

  it('scanAndRecover no hace nada si no hay overlays', () => {
    service.scanAndRecover('manual');
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('scanAndRecover elimina backdrop huérfano y limpia el body', () => {
    const el = document.createElement('div');
    el.className = 'modal-backdrop fade show';
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100vw';
    el.style.height = '100vh';
    el.style.zIndex = '1040';
    el.style.background = 'rgba(0,0,0,.5)';
    document.body.appendChild(el);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '12px';

    service.scanAndRecover('manual');

    expect(document.querySelectorAll('.modal-backdrop').length).toBe(0);
    expect(document.body.classList.contains('modal-open')).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('');
    expect(log.warn).toHaveBeenCalled();

    const raw = localStorage.getItem('op_ui_anomaly_snapshots_v1');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0].blockers.length).toBeGreaterThan(0);
  });

  it('scanAndRecover no elimina backdrop si hay un modal abierto', () => {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.width = '100px';
    modal.style.height = '100px';
    modal.style.display = 'block';
    document.body.appendChild(modal);

    const el = document.createElement('div');
    el.className = 'modal-backdrop fade show';
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100vw';
    el.style.height = '100vh';
    el.style.zIndex = '1040';
    document.body.appendChild(el);

    service.scanAndRecover('manual');

    expect(document.querySelectorAll('.modal-backdrop').length).toBe(1);
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('scanAndRecover ignora mobile-overlay legítimo', () => {
    const el = document.createElement('div');
    el.className = 'mobile-overlay';
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100vw';
    el.style.height = '100vh';
    el.style.zIndex = '1040';
    el.style.background = 'rgba(0,0,0,.5)';
    document.body.appendChild(el);

    service.scanAndRecover('manual');

    expect(document.querySelectorAll('.mobile-overlay').length).toBe(1);
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('scanAndRecover elimina loader overlay huérfano cuando no hay loading activo', () => {
    loading.getLoadingStats.and.returnValue({
      activeRequests: 0,
      trackedRequests: 0,
      isLoading: false,
    });

    const el = document.createElement('div');
    el.className = 'loading-overlay full-screen';
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100vw';
    el.style.height = '100vh';
    el.style.zIndex = '9999';
    el.style.background = 'rgba(0,0,0,.5)';
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    document.body.appendChild(el);

    service.scanAndRecover('manual');

    expect(document.querySelectorAll('.loading-overlay.full-screen').length).toBe(0);
    expect(loading.forceStopLoading).toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalled();
  });

  it('scanAndRecover no toca loader overlay si hay loading activo', () => {
    loading.getLoadingStats.and.returnValue({
      activeRequests: 1,
      trackedRequests: 1,
      isLoading: true,
    });

    const el = document.createElement('div');
    el.className = 'loading-overlay full-screen';
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100vw';
    el.style.height = '100vh';
    el.style.zIndex = '9999';
    el.style.background = 'rgba(0,0,0,.5)';
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    document.body.appendChild(el);

    service.scanAndRecover('manual');

    expect(document.querySelectorAll('.loading-overlay.full-screen').length).toBe(1);
    expect(loading.forceStopLoading).not.toHaveBeenCalled();
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('scanAndRecover no se ejecuta si enabled es false y el trigger no es manual', () => {
    service.setConfig({ enabled: false }, false);

    const el = document.createElement('div');
    el.className = 'modal-backdrop fade show';
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100vw';
    el.style.height = '100vh';
    el.style.zIndex = '1040';
    el.style.background = 'rgba(0,0,0,.5)';
    document.body.appendChild(el);
    document.body.classList.add('modal-open');

    service.scanAndRecover('startup_safety');

    expect(document.querySelectorAll('.modal-backdrop').length).toBe(1);
    expect(log.warn).not.toHaveBeenCalled();

    service.scanAndRecover('manual');

    expect(document.querySelectorAll('.modal-backdrop').length).toBe(0);
    expect(log.warn).toHaveBeenCalled();
  });
});
