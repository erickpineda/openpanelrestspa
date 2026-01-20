import { Injectable, NgZone } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../logger.service';
import { LoadingService } from './loading.service';

type UiAnomalyTrigger = 'navigation' | 'interval' | 'manual' | 'startup_safety';

export type UiAnomalyMonitorConfig = {
  enabled: boolean;
  scanIntervalMs: number;
  viewportCoverageThreshold: number;
};

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
  private routerSub: Subscription | null = null;
  private resourceErrorHandler: ((ev: any) => void) | null = null;
  private longTaskObserver: any | null = null;
  private debugApiInstalled = false;
  private configLoadedFromStorage = false;

  private longTaskCount = 0;
  private longTaskTotalMs = 0;
  private longTaskMaxMs = 0;

  private resourceErrors: { ts: string; message: string }[] = [];
  private readonly maxResourceErrors = 20;

  private readonly storageKey = 'op_ui_anomaly_snapshots_v1';
  private readonly maxSnapshots = 20;

  private readonly configStorageKey = 'op_ui_anomaly_monitor_config_v1';
  private config: UiAnomalyMonitorConfig = {
    enabled: false,
    scanIntervalMs: 1500,
    viewportCoverageThreshold: 0.8,
  };

  constructor(
    private router: Router,
    private zone: NgZone,
    private log: LoggerService,
    private loading: LoadingService
  ) {}

  start(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    this.loadConfigFromStorage();
    this.ensureDebugApi();

    if (this.started) return;
    if (!this.config.enabled) return;

    this.started = true;
    this.log.info('UiAnomalyMonitorService: started');

    this.installLongTaskObserver();
    this.installResourceErrorCapture();

    this.zone.runOutsideAngular(() => {
      this.routerSub = this.router.events
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
            // Delay scan to allow animations/cleanups to finish
            setTimeout(() => this.scanAndRecover('navigation'), 500);
          }
        });

      this.intervalId = setInterval(
        () => this.scanAndRecover('interval'),
        this.config.scanIntervalMs
      );
    });
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    if (this.routerSub) {
      this.routerSub.unsubscribe();
      this.routerSub = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.resourceErrorHandler) {
      try {
        window.removeEventListener('error', this.resourceErrorHandler as any, true);
      } catch {}
      this.resourceErrorHandler = null;
    }
    if (this.longTaskObserver && typeof this.longTaskObserver.disconnect === 'function') {
      try {
        this.longTaskObserver.disconnect();
      } catch {}
      this.longTaskObserver = null;
    }
  }

  getConfig(): UiAnomalyMonitorConfig {
    return { ...this.config };
  }

  setConfig(partial: Partial<UiAnomalyMonitorConfig>, persist: boolean = true): void {
    const next: UiAnomalyMonitorConfig = { ...this.config, ...partial };
    next.scanIntervalMs = this.normalizeScanInterval(next.scanIntervalMs);
    next.viewportCoverageThreshold = this.normalizeViewportCoverageThreshold(
      next.viewportCoverageThreshold
    );

    const enabledChanged = next.enabled !== this.config.enabled;
    const intervalChanged = next.scanIntervalMs !== this.config.scanIntervalMs;

    this.config = next;
    if (persist) this.persistConfigToStorage();
    this.ensureDebugApi();

    if (enabledChanged) {
      if (this.config.enabled) this.start();
      else this.stop();
      return;
    }

    if (intervalChanged && this.started) {
      try {
        clearInterval(this.intervalId);
      } catch {}
      this.zone.runOutsideAngular(() => {
        this.intervalId = setInterval(
          () => this.scanAndRecover('interval'),
          this.config.scanIntervalMs
        );
      });
    }
  }

  scanAndRecover(trigger: UiAnomalyTrigger = 'manual'): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const blockers = this.findViewportBlockers();
    if (blockers.length === 0) return;

    const loadingStats = (() => {
      try {
        return this.loading.getLoadingStats();
      } catch {
        return undefined;
      }
    })();

    const kinds = new Set(blockers.map((b) => b.kind));
    const hasOnlyMobileOverlay = kinds.size === 1 && kinds.has('mobile-overlay');
    if (hasOnlyMobileOverlay) return;

    const hasOnlyLoaderOverlay = kinds.size === 1 && kinds.has('loader-overlay');
    if (hasOnlyLoaderOverlay && loadingStats?.isLoading !== false) return;

    const hasOpenDialog = this.hasOpenDialogOrOffcanvas();
    const shouldRecover = !hasOpenDialog;
    if (!shouldRecover) {
      this.log.warn('UiAnomalyMonitor: blockers found but dialog is open/visible', {
        blockers,
        hasOpenDialog,
      });
      return;
    }

    const snapshot = this.captureSnapshot(trigger, blockers, hasOpenDialog, loadingStats);
    this.persistSnapshot(snapshot);
    try {
      (window as any).__OP_UI_ANOMALY__ = snapshot;
    } catch {}
    this.log.warn('UI: bloqueo de interacción detectado, aplicando recuperación', snapshot);

    const shouldRemoveLoaderOverlay =
      kinds.has('loader-overlay') && loadingStats?.isLoading === false;
    if (shouldRemoveLoaderOverlay) {
      try {
        this.loading.forceStopLoading();
      } catch {}
    }

    this.recoverFromBlockers({ removeLoaderOverlay: shouldRemoveLoaderOverlay });
  }

  forceCleanupForLogout(): void {
    this.log.info('UiAnomalyMonitor: Force cleanup for logout');
    try {
      this.loading.forceStopLoading(true);
    } catch {}
    this.recoverFromBlockers({ removeLoaderOverlay: true });
  }

  private installLongTaskObserver(): void {
    try {
      const w = window as any;
      if (!w.PerformanceObserver) return;

      if (this.longTaskObserver) return;
      this.longTaskObserver = new w.PerformanceObserver((list: any) => {
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
      this.longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch {}
  }

  private installResourceErrorCapture(): void {
    try {
      if (this.resourceErrorHandler) return;
      this.resourceErrorHandler = (ev: any) => {
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
      };
      window.addEventListener('error', this.resourceErrorHandler as any, true);
    } catch {}
  }

  private hasOpenDialogOrOffcanvas(): boolean {
    const doc = document;
    if (!doc) return false;

    const candidates = Array.from(
      doc.querySelectorAll('.modal.show, .offcanvas.show, [role="dialog"][aria-modal="true"]')
    ) as HTMLElement[];

    // Consider open only if it is actually visible in the layout
    return candidates.some((el) => {
      try {
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        if (cs.opacity === '0') return false;

        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      } catch {
        return false;
      }
    });
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
        const coversViewport =
          viewportArea > 0 ? area / viewportArea >= this.config.viewportCoverageThreshold : false;
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
    hasOpenDialog: boolean,
    loadingOverride?: { activeRequests: number; trackedRequests: number; isLoading: boolean }
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

    const loading =
      loadingOverride ||
      (() => {
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

  private ensureDebugApi(): void {
    if (typeof window === 'undefined') return;
    try {
      const w = window as any;
      if (!w.OPDebug) w.OPDebug = {};
      if (this.debugApiInstalled && w.OPDebug.uiAnomaly) return;
      w.OPDebug.uiAnomaly = {
        scan: () => this.scanAndRecover('manual'),
        getConfig: () => this.getConfig(),
        setConfig: (newConfig: Partial<UiAnomalyMonitorConfig>) => this.setConfig(newConfig),
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
      this.debugApiInstalled = true;
    } catch {}
  }

  private loadConfigFromStorage(): void {
    if (this.configLoadedFromStorage) return;
    this.configLoadedFromStorage = true;
    try {
      const raw = localStorage.getItem(this.configStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<UiAnomalyMonitorConfig>;
      const next: UiAnomalyMonitorConfig = { ...this.config, ...parsed };
      next.scanIntervalMs = this.normalizeScanInterval(next.scanIntervalMs);
      next.viewportCoverageThreshold = this.normalizeViewportCoverageThreshold(
        next.viewportCoverageThreshold
      );
      this.config = next;
    } catch {}
  }

  private persistConfigToStorage(): void {
    try {
      localStorage.setItem(this.configStorageKey, JSON.stringify(this.config));
    } catch {}
  }

  private normalizeScanInterval(ms: number): number {
    const n = Number(ms);
    if (!Number.isFinite(n)) return 1500;
    return Math.max(250, Math.round(n));
  }

  private normalizeViewportCoverageThreshold(v: number): number {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0.8;
    return Math.min(1, Math.max(0.2, n));
  }

  private recoverFromBlockers(opts: { removeLoaderOverlay: boolean }): void {
    const doc = document;
    if (!doc) return;

    const selectors = [
      '.modal-backdrop',
      '.offcanvas-backdrop',
      '.c-backdrop',
      '.c-modal-backdrop',
      '.c-offcanvas-backdrop',
      '.mobile-overlay',
    ].join(',');
    const loaderSelectors = '.loading-overlay.full-screen';

    const toRemove = Array.from(doc.querySelectorAll(selectors)) as HTMLElement[];
    for (const el of toRemove) {
      try {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      } catch {}
    }

    if (opts.removeLoaderOverlay) {
      const toRemoveLoader = Array.from(doc.querySelectorAll(loaderSelectors)) as HTMLElement[];
      for (const el of toRemoveLoader) {
        try {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        } catch {}
      }
    }

    try {
      doc.body.classList.remove('modal-open');
      doc.body.style.overflow = '';
      doc.body.style.paddingRight = '';
    } catch {}
  }
}
