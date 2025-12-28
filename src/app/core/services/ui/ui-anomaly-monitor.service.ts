import { Injectable, NgZone } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoggerService } from '../logger.service';
import { LoadingService } from './loading.service';

type UiAnomalyTrigger = 'navigation' | 'interval' | 'manual';

export type UiBlockerKind =
  | 'modal-backdrop'
  | 'offcanvas-backdrop'
  | 'coreui-backdrop'
  | 'mobile-overlay'
  | 'loader-overlay'
  | 'unknown';

export interface UiBlockerInfo {
  kind: UiBlockerKind;
  classes: string;
  id?: string;
  tag: string;
  zIndex?: number;
  opacity?: number;
  pointerEvents?: string;
  position?: string;
  rect?: { x: number; y: number; width: number; height: number };
}

export interface UiAnomalySnapshot {
  ts: string;
  trigger: UiAnomalyTrigger;
  url?: string;
  viewport?: { width: number; height: number; devicePixelRatio?: number };
  body?: { className: string; overflow?: string; paddingRight?: string };
  blockers: UiBlockerInfo[];
  hasOpenDialog: boolean;
  loading?: { activeRequests: number; trackedRequests: number; isLoading: boolean };
  longTasks?: { count: number; totalMs: number; maxMs: number };
  recentResourceErrors?: { ts: string; message: string }[];
}

@Injectable({ providedIn: 'root' })
export class UiAnomalyMonitorService {
  private started = false;
  private intervalId: any;

  private longTaskCount = 0;
  private longTaskTotalMs = 0;
  private longTaskMaxMs = 0;

  private resourceErrors: { ts: string; message: string }[] = [];
  private readonly maxResourceErrors = 20;

  private readonly storageKey = 'op_ui_anomaly_snapshots_v1';
  private readonly maxSnapshots = 20;

  constructor(
    private router: Router,
    private zone: NgZone,
    private log: LoggerService,
    private loading: LoadingService
  ) {}

  start(): void {
    if (this.started) return;
    this.started = true;

    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    try {
      const w = window as any;
      if (!w.OPDebug) w.OPDebug = {};
      w.OPDebug.uiAnomaly = {
        scan: () => this.scanAndRecover('manual'),
        getSnapshots: () => {
          try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        },
        clearSnapshots: () => {
          try {
            localStorage.removeItem(this.storageKey);
          } catch {}
        },
      };
    } catch {}

    this.installLongTaskObserver();
    this.installResourceErrorCapture();

    this.zone.runOutsideAngular(() => {
      this.router.events
        .pipe(
          filter(
            (e) =>
              e instanceof NavigationStart ||
              e instanceof NavigationEnd ||
              e instanceof NavigationCancel ||
              e instanceof NavigationError
          )
        )
        .subscribe((e) => {
          if (e instanceof NavigationEnd) {
            this.scanAndRecover('navigation');
          }
        });

      this.intervalId = setInterval(() => this.scanAndRecover('interval'), 1500);
    });
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  scanAndRecover(trigger: UiAnomalyTrigger = 'manual'): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const blockers = this.findViewportBlockers();
    if (blockers.length === 0) return;

    const hasOpenDialog = this.hasOpenDialogOrOffcanvas();
    const shouldRecover = !hasOpenDialog;
    if (!shouldRecover) return;

    const snapshot = this.captureSnapshot(trigger, blockers, hasOpenDialog);
    this.persistSnapshot(snapshot);
    try {
      (window as any).__OP_UI_ANOMALY__ = snapshot;
    } catch {}
    this.log.warn('UI: bloqueo de interacción detectado, aplicando recuperación', snapshot);

    this.recoverFromBlockers();
  }

  private installLongTaskObserver(): void {
    try {
      const w = window as any;
      if (!w.PerformanceObserver) return;

      const obs = new w.PerformanceObserver((list: any) => {
        try {
          const entries = list.getEntries ? list.getEntries() : [];
          for (const e of entries) {
            const d = typeof e.duration === 'number' ? e.duration : 0;
            this.longTaskCount++;
            this.longTaskTotalMs += d;
            this.longTaskMaxMs = Math.max(this.longTaskMaxMs, d);
          }
        } catch {}
      });
      obs.observe({ entryTypes: ['longtask'] });
    } catch {}
  }

  private installResourceErrorCapture(): void {
    try {
      window.addEventListener(
        'error',
        (ev: any) => {
          try {
            const isResourceError = ev && ev.target && ev.target !== window;
            if (!isResourceError) return;
            const target = ev.target as HTMLElement;
            const src = (target as any).src || (target as any).href || '';
            const tag = (target && target.tagName) || 'UNKNOWN';
            const msg = `ResourceError ${tag} ${src}`.trim();
            this.resourceErrors.unshift({ ts: new Date().toISOString(), message: msg });
            this.resourceErrors = this.resourceErrors.slice(0, this.maxResourceErrors);
          } catch {}
        },
        true
      );
    } catch {}
  }

  private hasOpenDialogOrOffcanvas(): boolean {
    const doc = document;
    if (!doc) return false;

    const anyDialog =
      doc.querySelector('.modal.show') ||
      doc.querySelector('.offcanvas.show') ||
      doc.querySelector('[role="dialog"][aria-modal="true"]');

    return !!anyDialog;
  }

  private findViewportBlockers(): UiBlockerInfo[] {
    const doc = document;
    if (!doc) return [];

    const candidates = Array.from(
      doc.querySelectorAll(
        [
          '.modal-backdrop',
          '.offcanvas-backdrop',
          '.c-backdrop',
          '.c-modal-backdrop',
          '.c-offcanvas-backdrop',
          '.mobile-overlay',
          '.loading-overlay.full-screen',
        ].join(',')
      )
    ) as HTMLElement[];

    const vw = Math.max(1, window.innerWidth || 1);
    const vh = Math.max(1, window.innerHeight || 1);

    const blockers: UiBlockerInfo[] = [];
    for (const el of candidates) {
      try {
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (cs.pointerEvents === 'none') continue;

        const rect = el.getBoundingClientRect();
        const area = Math.max(0, rect.width) * Math.max(0, rect.height);
        const viewportArea = vw * vh;
        const coversViewport = viewportArea > 0 ? area / viewportArea >= 0.8 : false;
        if (!coversViewport) continue;

        const z = Number(cs.zIndex);
        const opacity = Number(cs.opacity);
        if (Number.isFinite(opacity) && opacity <= 0.05) continue;

        blockers.push({
          kind: this.classifyBlocker(el),
          classes: (el.className || '').toString(),
          id: el.id || undefined,
          tag: el.tagName,
          zIndex: Number.isFinite(z) ? z : undefined,
          opacity: Number.isFinite(opacity) ? opacity : undefined,
          pointerEvents: cs.pointerEvents,
          position: cs.position,
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
        });
      } catch {}
    }
    return blockers;
  }

  private classifyBlocker(el: HTMLElement): UiBlockerKind {
    const c = (el.className || '').toString();
    if (c.includes('modal-backdrop')) return 'modal-backdrop';
    if (c.includes('offcanvas-backdrop')) return 'offcanvas-backdrop';
    if (c.includes('mobile-overlay')) return 'mobile-overlay';
    if (c.includes('loading-overlay')) return 'loader-overlay';
    if (c.includes('c-backdrop') || c.includes('c-modal-backdrop') || c.includes('c-offcanvas')) {
      return 'coreui-backdrop';
    }
    return 'unknown';
  }

  private captureSnapshot(
    trigger: UiAnomalyTrigger,
    blockers: UiBlockerInfo[],
    hasOpenDialog: boolean
  ): UiAnomalySnapshot {
    const ts = new Date().toISOString();
    const url = (() => {
      try {
        return window.location.href;
      } catch {
        return undefined;
      }
    })();

    const viewport = {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0,
      devicePixelRatio: typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1,
    };
    const body = (() => {
      try {
        const b = document.body;
        const cs = window.getComputedStyle(b);
        return {
          className: b.className || '',
          overflow: cs.overflow,
          paddingRight: cs.paddingRight,
        };
      } catch {
        return { className: '' };
      }
    })();

    const loading = (() => {
      try {
        return this.loading.getLoadingStats();
      } catch {
        return undefined;
      }
    })();

    const longTasks = {
      count: this.longTaskCount,
      totalMs: Math.round(this.longTaskTotalMs),
      maxMs: Math.round(this.longTaskMaxMs),
    };

    const recentResourceErrors = this.resourceErrors.slice(0, this.maxResourceErrors);

    return {
      ts,
      trigger,
      url,
      viewport,
      body,
      blockers,
      hasOpenDialog,
      loading,
      longTasks,
      recentResourceErrors,
    };
  }

  private persistSnapshot(snapshot: UiAnomalySnapshot): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const list: UiAnomalySnapshot[] = raw ? (JSON.parse(raw) as UiAnomalySnapshot[]) : [];
      const next = [snapshot, ...(Array.isArray(list) ? list : [])].slice(0, this.maxSnapshots);
      localStorage.setItem(this.storageKey, JSON.stringify(next));
    } catch {}
  }

  private recoverFromBlockers(): void {
    const doc = document;
    if (!doc) return;

    const selectors = [
      '.modal-backdrop',
      '.offcanvas-backdrop',
      '.c-backdrop',
      '.c-modal-backdrop',
      '.c-offcanvas-backdrop',
    ].join(',');
    const toRemove = Array.from(doc.querySelectorAll(selectors)) as HTMLElement[];
    for (const el of toRemove) {
      try {
        el.remove();
      } catch {}
    }

    try {
      doc.body.classList.remove('modal-open');
      doc.body.style.overflow = '';
      doc.body.style.paddingRight = '';
    } catch {}
  }
}
