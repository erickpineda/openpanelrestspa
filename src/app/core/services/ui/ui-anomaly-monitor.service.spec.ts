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
    loading = jasmine.createSpyObj<LoadingService>('LoadingService', ['getLoadingStats']);
    loading.getLoadingStats.and.returnValue({ activeRequests: 0, trackedRequests: 0, isLoading: false });

    try {
      localStorage.removeItem('op_ui_anomaly_snapshots_v1');
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
    document.querySelectorAll('.modal-backdrop,.offcanvas-backdrop,.c-backdrop').forEach((n) => {
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

    service.start();
    events$.next(new NavigationEnd(1, '/x', '/x'));
    expect(scanSpy).toHaveBeenCalledWith('navigation');

    jasmine.clock().tick(1600);
    expect(scanSpy).toHaveBeenCalledWith('interval');

    const callsAfterTick = scanSpy.calls.count();
    service.stop();
    jasmine.clock().tick(3000);
    expect(scanSpy.calls.count()).toBe(callsAfterTick);
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
});
