import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { EntradaService } from '../../../core/services/data/entrada.service';
import { UsuarioService } from '../../../core/services/data/usuario.service';
import { Subscription, forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../../../core/services/logger.service';
import { DashboardApiService } from '../../../core/services/dashboard-api.service';
import { DashboardFacadeService } from './srv/dashboard-facade.service';
import { LoadingService } from '../../../core/services/ui/loading.service';
import {
  ActivityPointDTO,
  SummaryDTO,
  SummaryEntryDTO,
  TopItemDTO,
  StorageDTO,
  ContentStatsDTO,
} from '../../../shared/models/dashboard.models';
import { ToastService } from '../../../core/services/ui/toast.service';
import { parseAllowedDate } from '../../../shared/utils/date-utils';
import { environment } from '../../../../environments/environment';
import { AuthSyncService } from '../../../core/services/auth/auth-sync.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false,
})
export class DashboardComponent implements OnInit, OnDestroy {
  errorSummary: string | null = null;
  errorSplitEstadoNombre: string | null = null;
  // showRefreshFeedback eliminado, se usará ToastService
  // Suma total de un estado específico en el periodo actual
  getKpiPorEstado(estado: string): number {
    if (this.seriesEntriesSplitData && Array.isArray(this.seriesEntriesSplitData.datasets)) {
      const ds = this.seriesEntriesSplitData.datasets.find((d: any) => d.label === estado);
      if (ds && Array.isArray(ds.data)) {
        return ds.data.reduce((acc: number, v: number) => acc + (Number(v) || 0), 0);
      }
    }
    return 0;
  }

  // Suma total de todos los estados excepto el indicado
  getKpiExceptoEstado(estado: string): number {
    if (this.seriesEntriesSplitData && Array.isArray(this.seriesEntriesSplitData.datasets)) {
      return this.seriesEntriesSplitData.datasets
        .filter((d: any) => d.label !== estado)
        .reduce(
          (acc: number, ds: any) =>
            acc +
            (Array.isArray(ds.data)
              ? ds.data.reduce((a: number, v: number) => a + (Number(v) || 0), 0)
              : 0),
          0
        );
    }
    return 0;
  }
  // KPI Publicadas: solo el estado 'PUBLICADA'
  get kpiPublicadas(): number {
    if (this.contentStats && this.contentStats.entradasByEstado) {
      const keys = Object.keys(this.contentStats.entradasByEstado);
      const key = keys.find((k) => k.trim().toUpperCase() === 'PUBLICADA');
      return key ? Number(this.contentStats.entradasByEstado[key]) || 0 : 0;
    }
    return 0;
  }

  // KPI No Publicadas: suma de todos los estados que no sean 'PUBLICADA'
  get kpiNoPublicadas(): number {
    if (this.contentStats && this.contentStats.entradasByEstado) {
      return Object.entries(this.contentStats.entradasByEstado)
        .filter(([k]) => k.trim().toUpperCase() !== 'PUBLICADA')
        .reduce((acc, [, v]) => acc + (Number(v) || 0), 0);
    }
    return 0;
  }

  cantidadUsuariosActivos: number = 0;
  totalEntradas: number = 0;

  entradasMesPublicadas: number[] = Array(12).fill(0);
  entradasMesNoPublicadas: number[] = Array(12).fill(0);
  latestEntries: SummaryEntryDTO[] = [];
  recentItems: any[] = [];
  recentPage = 0;
  recentSize = 5;
  recentTotalPages = 0;

  topUsers: TopItemDTO[] = [];
  topCategories: TopItemDTO[] = [];
  topTags: TopItemDTO[] = [];
  topLimit = 10;

  storage?: StorageDTO;
  contentStats?: ContentStatsDTO;
  contentStatsChartData: any;

  loadingSummary = false;
  loadingSeries = false;
  loadingTopUsers = false;
  loadingTopCategories = false;
  loadingTopTags = false;
  loadingStorage = false;
  loadingContentStats = false;
  loadingRecent = false;
  loadingSplitEstado = false;
  loadingSplitEstadoNombre = false;
  errorRecent: string | null = null;
  errorTopUsers: string | null = null;
  errorTopCategories: string | null = null;
  errorTopTags: string | null = null;
  errorStorage: string | null = null;
  errorContentStats: string | null = null;
  errorSplitEstado: string | null = null;

  data: any = {
    labels: [],
    datasets: [],
  };
  private dataRawLabels: string[] = [];
  private colorPalette: string[] = [
    '#4e79a7',
    '#f28e2b',
    '#e15759',
    '#76b7b2',
    '#59a14f',
    '#edc948',
    '#b07aa1',
    '#ff9da7',
    '#9c755f',
    '#bab0ab',
    '#1f77b4',
    '#d62728',
  ];
  private colorForLabel(label: string, i: number = 0): string {
    let h = 0;
    for (let k = 0; k < label.length; k++) h = (h * 31 + label.charCodeAt(k)) >>> 0;
    const idx = (h + i) % this.colorPalette.length;
    return this.colorPalette[idx];
  }

  seriesDays = 30;
  seriesGranularity: 'hour' | 'day' | 'week' | 'month' = 'day';
  seriesEntriesSplitData: any;
  seriesEntriesSplitEstadoNombreData: any;
  estadoNominalChartType: 'line' | 'bar' = 'bar';
  estadoNominalStacked = true;
  estadoNominalChartOptions: any;
  topPeriodDays = 30;

  showSettingsModal = false;
  settings: {
    seriesDays: number;
    seriesGranularity: 'hour' | 'day' | 'week' | 'month';
    topLimit: number;
    topPeriodDays: number;
    topStartDate?: string;
    topEndDate?: string;
  } = {
    seriesDays: this.seriesDays,
    seriesGranularity: this.seriesGranularity,
    topLimit: this.topLimit,
    topPeriodDays: this.topPeriodDays,
  };
  private settingsInitial: {
    seriesDays: number;
    seriesGranularity: 'hour' | 'day' | 'week' | 'month';
    topLimit: number;
    topPeriodDays: number;
    topStartDate?: string;
    topEndDate?: string;
  } | null = null;
  clearFeedback: string | null = null;
  topCustomStartDate?: string;
  topCustomEndDate?: string;
  exportingZip = false;
  exportError: string | null = null;

  private subscription: Subscription = new Subscription();
  perf: Record<string, number> = {};
  perfUpdatedAt: Date | null = null;
  metricsExpanded: boolean = false;
  forceFromDb: boolean = false;
  private onAuthChangedHandler?: (ev: any) => void;

  constructor(
    private usuarioService: UsuarioService,
    private entradaService: EntradaService,
    private cdr: ChangeDetectorRef,
    private log: LoggerService,
    private dashboardApi: DashboardApiService,
    private dashboardFacade: DashboardFacadeService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private authSync: AuthSyncService
  ) {}

  private initDefaultData(): void {
    const labels: string[] = [];
    const rawLabels: string[] = [];
    const now = new Date();
    for (let i = this.seriesDays - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - i);
      const s = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      labels.push(this.formatLabelFromDate(s, 'day', false));
      rawLabels.push(s);
    }
    const zeros = Array(labels.length).fill(0);
    this.data = {
      labels,
      datasets: [
        { label: 'Entradas', backgroundColor: '#007bff', data: [...zeros] },
        { label: 'Comentarios', backgroundColor: '#ff7f0e', data: [...zeros] },
        { label: 'Usuarios', backgroundColor: '#2ca02c', data: [...zeros] },
      ],
    };
    this.dataRawLabels = rawLabels;
  }

  async ngOnInit(): Promise<void> {
    this.initDefaultData();
    try {
      const s = sessionStorage.getItem(OPConstants.Storage.DASH_METRICS_EXPANDED_KEY);
      this.metricsExpanded = s === '1';
    } catch {}
    try {
      const f = sessionStorage.getItem(OPConstants.Storage.DASH_FORCE_DB_KEY);
      if (f === '1') this.forceFromDb = true;
      else if (f === '0') this.forceFromDb = false;
    } catch {}
    try {
      if ((window as any).__E2E_POPULATE_DASHBOARD__ === true) {
        this.populateMockForE2E();
      }
    } catch {}
    this.refreshDashboard();
    this.loadRecentActivity();
    this.onAuthChangedHandler = (ev: any) => {
      const d = ev && ev.detail ? ev.detail : null;
      const key = d && d.key ? String(d.key) : '';
      if (key === OPConstants.Storage.DASH_FORCE_DB_KEY) {
        const v = d && d.value ? String(d.value) : '';
        this.forceFromDb = v === '1';
        try {
          this.cdr.detectChanges();
        } catch {}
      }
    };
    try {
      window.addEventListener(OPConstants.Events.AUTH_CHANGED, this.onAuthChangedHandler as any);
    } catch {}
  }

  private markPerf(t0: number, name: string): void {
    try {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = Math.round(now - t0);
      this.perf[name] = elapsed;
      this.perfUpdatedAt = new Date();
    } catch {}
  }

  metricsVisible(): boolean {
    try {
      const win = typeof window !== 'undefined' ? window : null;
      const searchFlag = win
        ? new URLSearchParams(win.location.search).get('metrics') === '1'
        : false;
      const hash = win ? win.location.hash || '' : '';
      const qm = hash.indexOf('?');
      const hashFlag =
        qm >= 0 ? new URLSearchParams(hash.substring(qm + 1)).get('metrics') === '1' : false;
      const urlFlag = searchFlag || hashFlag;
      return this.isLocalEnv() && (this.metricsExpanded || urlFlag);
    } catch {
      return false;
    }
  }

  private setHashParam(key: string, value: string | null): void {
    try {
      const h = typeof window !== 'undefined' ? window.location.hash : '';
      const raw = h.startsWith('#') ? h.substring(1) : h;
      const qm = raw.indexOf('?');
      const base = qm >= 0 ? raw.substring(0, qm) : raw;
      const qs = qm >= 0 ? raw.substring(qm + 1) : '';
      const sp = new URLSearchParams(qs);
      if (value === null) sp.delete(key);
      else sp.set(key, value);
      const next = '#' + base + (sp.toString() ? '?' + sp.toString() : '');
      if (typeof window !== 'undefined') window.location.hash = next;
    } catch {}
  }

  metricsToggle(): void {
    if (!this.isLocalEnv()) return;
    this.metricsExpanded = !this.metricsExpanded;
    try {
      sessionStorage.setItem(
        OPConstants.Storage.DASH_METRICS_EXPANDED_KEY,
        this.metricsExpanded ? '1' : '0'
      );
    } catch {}
  }

  toggleForceFromDb(): void {
    this.forceFromDb = !this.forceFromDb;
    try {
      sessionStorage.setItem(OPConstants.Storage.DASH_FORCE_DB_KEY, this.forceFromDb ? '1' : '0');
    } catch {}
    try {
      this.authSync.notifyChanged({
        key: OPConstants.Storage.DASH_FORCE_DB_KEY,
        value: this.forceFromDb ? '1' : '0',
      });
    } catch {}
  }

  async copyPerfToClipboard(): Promise<void> {
    try {
      const payload = {
        updatedAt: this.perfUpdatedAt ? this.perfUpdatedAt.toISOString() : null,
        perf: this.perf,
      };
      const text = JSON.stringify(payload, null, 2);
      if (navigator && (navigator as any).clipboard && (navigator as any).clipboard.writeText) {
        await (navigator as any).clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.toastService.showSuccess('Métricas copiadas', 'Dashboard');
    } catch {
      this.toastService.showError('No se pudieron copiar las métricas', 'Dashboard');
    }
  }

  isLocalEnv(): boolean {
    return (environment as any).production === false;
  }

  private loadAllDashboardData(force: boolean = true): void {
    const t0 = Date.now();
    this.loadingService.registerRetryHandler(() => this.loadAllDashboardData(true));
    this.loadingService.setGlobalLoading(true);
    this.loadingSeries = true;
    this.errorSummary = null;
    if (!force) {
      try {
        this.dashboardApi.evictSummary();
        this.dashboardApi.evictSeries(this.seriesDays);
        this.dashboardApi.evictTop();
        this.dashboardApi.evictContentStats();
      } catch {}
    }
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const mark = (name: string) => {
      try {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.log.debug(`[perf] ${name} ms`, Math.round(now - start));
        this.markPerf(start, name);
      } catch {}
    };
    const sub = this.dashboardFacade
      .refreshAll(
        this.seriesDays,
        this.seriesGranularity,
        this.topLimit,
        force,
        this.topCustomStartDate,
        this.topCustomEndDate
      )
      .subscribe({
        next: ([summary, series, topUsers, topCategories, topTags, storage, contentStats]) => {
          try {
            if (summary) {
              this.totalEntradas = (summary as SummaryDTO).totalEntradas || 0;
              this.cantidadUsuariosActivos = (summary as SummaryDTO).totalUsuarios || 0;
              this.latestEntries = (summary as SummaryDTO).ultimasEntradas || [];
            }

            if (Array.isArray(series)) {
              this.data = {
                labels: (series as ActivityPointDTO[]).map((p) => this.formatLabelFromDate(p.date)),
                datasets: [
                  {
                    label: 'Entradas',
                    backgroundColor: '#007bff',
                    data: (series as ActivityPointDTO[]).map((p) => p.entradas),
                  },
                  {
                    label: 'Comentarios',
                    backgroundColor: '#ff7f0e',
                    data: (series as ActivityPointDTO[]).map((p) => p.comentarios),
                  },
                  {
                    label: 'Usuarios',
                    backgroundColor: '#2ca02c',
                    data: (series as ActivityPointDTO[]).map((p) => p.usuarios),
                  },
                ],
              };
              this.dataRawLabels = (series as ActivityPointDTO[]).map((p) => String(p.date || ''));
            }
            this.topUsers = Array.isArray(topUsers) ? topUsers : this.topUsers;
            this.topCategories = Array.isArray(topCategories) ? topCategories : this.topCategories;
            this.topTags = Array.isArray(topTags) ? topTags : this.topTags;
            this.storage = storage as StorageDTO;
            this.contentStats = contentStats as ContentStatsDTO;
            if (contentStats && (contentStats as ContentStatsDTO).entradasByEstado) {
              this.updateContentStatsChart(contentStats as ContentStatsDTO);
            }
            this.loadSeriesEntriesSplitEstado();
            this.loadSeriesEntriesSplitEstadoNombre();
            this.toastService.showSuccess('Datos actualizados', 'Dashboard');
            this.cdr.detectChanges();
          } finally {
            this.loadingSeries = false;
            this.loadingService.setGlobalLoading(false);
            try {
              this.log.debug('Dashboard loadAll total ms', Date.now() - t0);
            } catch {}
          }
        },
        error: (err) => {
          this.errorSummary = 'Error refrescando dashboard';
          this.log.error('Error refrescando dashboard', err);
          this.focusRetry('.retry-btn-summary');
          this.loadingSeries = false;
          this.loadingService.forceStopLoading();
        },
      });
    this.subscription.add(sub);
  }

  refreshDashboard(): void {
    this.loadAllDashboardData(this.forceFromDb === true);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    try {
      if (this.onAuthChangedHandler)
        window.removeEventListener(
          OPConstants.Events.AUTH_CHANGED,
          this.onAuthChangedHandler as any
        );
    } catch {}
  }

  async cargarEstadisticas(): Promise<void> {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const mark = (name: string) => {
      try {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.log.debug(`[perf] ${name} ms`, Math.round(now - t0));
        this.markPerf(t0, name);
      } catch {}
    };
    this.loadingService.registerRetryHandler(() => this.cargarEstadisticas());
    this.loadingService.setGlobalLoading(true);
    this.errorSummary = null;
    const summarySub = this.dashboardApi.getSummary().subscribe({
      next: (summary: SummaryDTO) => {
        this.totalEntradas = summary.totalEntradas || 0;
        this.cantidadUsuariosActivos = summary.totalUsuarios || 0;
        this.latestEntries = summary.ultimasEntradas || [];

        // Si vienen series preconstruidas usar getSeriesActivity; si no, mapeamos ultimasEntradas
        if (summary.ultimasEntradas && summary.ultimasEntradas.length) {
          // Mapeo robusto: parsear fechas en formato 'DD-MM-YYYY' o 'DD-MM-YYYY HH:mm:ss'
          summary.ultimasEntradas.forEach((e: SummaryEntryDTO) => {
            const fechaStr = e.fechaCreacion;
            let mesIdx = 0;
            const parsed = this.parseBackendDate(fechaStr);
            if (parsed) mesIdx = parsed.getMonth();
            if (e.estado && e.estado.toUpperCase() === 'PUBLICADA')
              this.entradasMesPublicadas[mesIdx] += 1;
            else this.entradasMesNoPublicadas[mesIdx] += 1;
          });
        }

        mark('summary(cargar)');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorSummary = 'Error obteniendo summary';
        mark('summary(cargar):error');
        this.log.error('Error obteniendo summary', err);
      },
    });

    this.subscription.add(summarySub);

    // Cargar series de actividad para gráfico principal
    const seriesSub = this.dashboardApi
      .getSeriesActivity(this.seriesDays, true, this.seriesGranularity)
      .subscribe({
        next: (points: ActivityPointDTO[]) => {
          if (points && points.length) {
            this.data = {
              labels: points.map((p) => this.formatLabelFromDate(p.date)),
              datasets: [
                {
                  label: 'Entradas',
                  backgroundColor: '#007bff',
                  data: points.map((p) => p.entradas),
                },
                {
                  label: 'Comentarios',
                  backgroundColor: '#ff7f0e',
                  data: points.map((p) => p.comentarios),
                },
                {
                  label: 'Usuarios',
                  backgroundColor: '#2ca02c',
                  data: points.map((p) => p.usuarios),
                },
              ],
            };
            this.dataRawLabels = points.map((p) => String(p.date || ''));
            mark('series(cargar)');
            this.cdr.detectChanges();
            // Si summary ya terminó, detener loader; lo controlamos también en refresh
            this.loadingService.setGlobalLoading(false);
          }
        },
        error: (err: any) => {
          this.errorSummary = 'Error obteniendo series';
          mark('series(cargar):error');
          this.log.error('Error obteniendo series', err);
        },
      });

    this.subscription.add(seriesSub);
  }

  loadTopWidgets(): void {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const mark = (name: string) => {
      try {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.log.debug(`[perf] ${name} ms`, Math.round(now - t0));
        this.markPerf(t0, name);
      } catch {}
    };
    this.loadingTopUsers = true;
    this.loadingTopCategories = true;
    this.loadingTopTags = true;
    this.errorTopUsers = null;
    this.errorTopCategories = null;
    this.errorTopTags = null;
    const { startDate, endDate } =
      this.topCustomStartDate && this.topCustomEndDate
        ? { startDate: this.topCustomStartDate, endDate: this.topCustomEndDate }
        : this.getPeriodDates(this.topPeriodDays);
    const subTopUsers = this.dashboardFacade
      .getTop('users', this.topLimit, false, startDate, endDate)
      .subscribe({
        next: (items: TopItemDTO[]) => {
          this.topUsers = items || [];
          this.loadingTopUsers = false;
          mark('topUsers');
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingTopUsers = false;
          this.errorTopUsers = 'Error obteniendo Top Usuarios';
          mark('topUsers:error');
          this.focusRetry('.retry-btn-top-users');
        },
      });
    const subTopCategories = this.dashboardFacade
      .getTop('categories', this.topLimit, false, startDate, endDate)
      .subscribe({
        next: (items: TopItemDTO[]) => {
          this.topCategories = items || [];
          this.loadingTopCategories = false;
          mark('topCategories');
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingTopCategories = false;
          this.errorTopCategories = 'Error obteniendo Top Categorías';
          mark('topCategories:error');
          this.focusRetry('.retry-btn-top-categories');
        },
      });
    const subTopTags = this.dashboardFacade
      .getTop('tags', this.topLimit, false, startDate, endDate)
      .subscribe({
        next: (items: TopItemDTO[]) => {
          this.topTags = items || [];
          this.loadingTopTags = false;
          mark('topTags');
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingTopTags = false;
          this.errorTopTags = 'Error obteniendo Top Tags';
          mark('topTags:error');
          this.focusRetry('.retry-btn-top-tags');
        },
      });
    this.subscription.add(subTopUsers);
    this.subscription.add(subTopCategories);
    this.subscription.add(subTopTags);
  }

  onChangeTopLimit(limit: number): void {
    const l = Math.max(1, Math.min(200, Number(limit) || 10));
    this.topLimit = l;
    this.loadTopWidgets();
  }

  loadStorage(): void {
    this.loadingStorage = true;
    this.errorStorage = null;
    const sub = this.dashboardFacade.getStorage().subscribe({
      next: (s: StorageDTO) => {
        this.storage = s;
        this.loadingStorage = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingStorage = false;
        this.errorStorage = 'Error obteniendo almacenamiento';
        this.focusRetry('.retry-btn-storage');
      },
    });
    this.subscription.add(sub);
  }

  loadContentStats(): void {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const mark = (name: string) => {
      try {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.log.debug(`[perf] ${name} ms`, Math.round(now - t0));
        this.markPerf(t0, name);
      } catch {}
    };
    this.loadingContentStats = true;
    this.errorContentStats = null;
    const sub = this.dashboardFacade.getContentStats().subscribe({
      next: (cs: ContentStatsDTO) => {
        this.contentStats = cs;
        this.updateContentStatsChart(cs);
        this.loadingContentStats = false;
        mark('contentStats(load)');
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingContentStats = false;
        this.errorContentStats = 'Error obteniendo estadísticas de contenido';
        mark('contentStats(load):error');
        this.focusRetry('.retry-btn-content');
      },
    });
    this.subscription.add(sub);
  }

  loadRecentActivity(): void {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const mark = (name: string) => {
      try {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.log.debug(`[perf] ${name} ms`, Math.round(now - t0));
      } catch {}
    };
    this.loadingRecent = true;
    this.errorRecent = null;
    const sub = this.dashboardFacade.getRecentActivity(this.recentPage, this.recentSize).subscribe({
      next: (r: any) => {
        if (Array.isArray(r)) {
          this.recentItems = r;
          this.recentTotalPages = r.length ? 1 : 0;
        } else if (r && Array.isArray(r.content)) {
          this.recentItems = r.content;
          this.recentTotalPages = Number(r.totalPages) || 0;
          this.recentPage = Number(r.number) || this.recentPage;
        } else if (r && Array.isArray(r.elements)) {
          this.recentItems = r.elements;
          this.recentTotalPages = Number(r.totalPages) || 0;
        } else if (r && Array.isArray(r.ultimasEntradas)) {
          this.recentItems = r.ultimasEntradas;
          this.recentTotalPages = 1;
        } else {
          this.recentItems = [];
          this.recentTotalPages = 0;
        }
        this.loadingRecent = false;
        mark('recent');
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorRecent = 'Error obteniendo actividad reciente';
        this.loadingRecent = false;
        mark('recent:error');
        this.focusRetry('.retry-btn-recent');
      },
    });
    this.subscription.add(sub);
  }

  onRecentPageChange(page: number): void {
    this.recentPage = page;
    this.loadRecentActivity();
  }

  onRecentSizeChange(size: number): void {
    const s = Math.max(1, Math.min(200, Number(size) || 5));
    this.recentSize = s;
    this.recentPage = 0;
    this.loadRecentActivity();
  }

  formatBytes(bytes?: number): string {
    const b = Number(bytes) || 0;
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  changeSeriesDays(days: number): void {
    const d = Math.max(1, Math.min(365, Number(days) || 30));
    this.seriesDays = d;
    const sub = this.dashboardFacade
      .getSeries(this.seriesDays, true, this.seriesGranularity)
      .subscribe({
        next: (points: ActivityPointDTO[]) => {
          this.data = {
            labels: points.map((p) => this.formatLabelFromDate(p.date)),
            datasets: [
              {
                label: 'Entradas',
                backgroundColor: '#007bff',
                data: points.map((p) => p.entradas),
              },
              {
                label: 'Comentarios',
                backgroundColor: '#ff7f0e',
                data: points.map((p) => p.comentarios),
              },
              {
                label: 'Usuarios',
                backgroundColor: '#2ca02c',
                data: points.map((p) => p.usuarios),
              },
            ],
          };
          this.cdr.detectChanges();
        },
      });
    this.subscription.add(sub);
    this.loadSeriesEntriesSplitEstado();
    this.loadSeriesEntriesSplitEstadoNombre();
    this.updateEstadoNominalOptions();
  }

  changeSeriesGranularity(g: 'hour' | 'day' | 'week' | 'month'): void {
    this.seriesGranularity = g;
    this.changeSeriesDays(this.seriesDays);
  }

  openSettings(): void {
    this.settings = {
      seriesDays: this.seriesDays,
      seriesGranularity: this.seriesGranularity,
      topLimit: this.topLimit,
      topPeriodDays: this.topPeriodDays,
      topStartDate: this.topCustomStartDate,
      topEndDate: this.topCustomEndDate,
    };
    this.settingsInitial = { ...this.settings };
    this.clearFeedback = null;
    this.showSettingsModal = true;
  }

  closeSettings(): void {
    this.showSettingsModal = false;
  }

  applySettings(): void {
    const sd = Math.max(1, Math.min(365, Number(this.settings.seriesDays) || this.seriesDays));
    const tl = Math.max(1, Math.min(200, Number(this.settings.topLimit) || this.topLimit));
    const tp = Math.max(
      1,
      Math.min(365, Number(this.settings.topPeriodDays) || this.topPeriodDays)
    );

    const gran = this.settings.seriesGranularity;
    const sDate = this.settings.topStartDate;
    const eDate = this.settings.topEndDate;

    const changedDays = sd !== this.seriesDays;
    const changedGran = gran !== this.seriesGranularity;
    const changedTopLimit = tl !== this.topLimit;
    const changedTopPeriod = tp !== this.topPeriodDays;

    this.seriesDays = sd;
    this.seriesGranularity = gran;
    this.topLimit = tl;
    this.topPeriodDays = tp;

    if (sDate && eDate && this.isValidDateRange(sDate, eDate)) {
      this.topCustomStartDate = sDate;
      this.topCustomEndDate = eDate;
    } else {
      this.topCustomStartDate = undefined;
      this.topCustomEndDate = undefined;
    }

    if (changedDays || changedGran) {
      this.dashboardFacade.evictSeries(sd);
      this.changeSeriesDays(this.seriesDays);
    }
    if (changedTopLimit || changedTopPeriod || this.topCustomStartDate || this.topCustomEndDate) {
      this.dashboardFacade.evictTop('users');
      this.dashboardFacade.evictTop('categories');
      this.dashboardFacade.evictTop('tags');
      this.loadTopWidgets();
    }

    this.showSettingsModal = false;
  }

  resetSettings(): void {
    this.settings = {
      seriesDays: 30,
      seriesGranularity: 'day',
      topLimit: 10,
      topPeriodDays: 30,
      topStartDate: undefined,
      topEndDate: undefined,
    };
    this.clearFeedback = 'Campos restablecidos a valores por defecto';
    this.cdr.detectChanges();
  }

  private isValidDateRange(s: string, e: string): boolean {
    try {
      const sd = new Date(s + 'T00:00:00Z');
      const ed = new Date(e + 'T00:00:00Z');
      return !isNaN(sd.getTime()) && !isNaN(ed.getTime()) && sd.getTime() <= ed.getTime();
    } catch {
      return false;
    }
  }

  downloadCurrentData(): void {
    try {
      const payload: any = {
        timestamp: new Date().toISOString(),
        series: this.data,
        seriesGranularity: this.seriesGranularity,
        seriesDays: this.seriesDays,
        seriesEntriesSplit: this.seriesEntriesSplitData,
        seriesEntriesSplitEstadoNombre: this.seriesEntriesSplitEstadoNombreData,
        top: {
          users: this.topUsers,
          categories: this.topCategories,
          tags: this.topTags,
          limit: this.topLimit,
          periodDays: this.topPeriodDays,
          startDate: this.topCustomStartDate,
          endDate: this.topCustomEndDate,
        },
        storage: this.storage,
        contentStats: this.contentStats,
        latestEntries: this.latestEntries,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const name = `dashboard_export_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.json`;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }

  private csvEscape(v: any): string {
    const s = String(v ?? '');
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  }

  private buildCsv(headers: string[], rows: any[][]): string {
    const head = headers.map((h) => this.csvEscape(h)).join(',');
    const body = rows.map((r) => r.map((c) => this.csvEscape(c)).join(',')).join('\n');
    return `${head}\n${body}\n`;
  }

  private saveCsv(name: string, csv: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadCsv(): void {
    try {
      const now = new Date();
      const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

      // Serie principal
      if (this.data && Array.isArray(this.data.labels) && Array.isArray(this.data.datasets)) {
        const headers = [
          'date',
          ...this.data.datasets.map((ds: any) => String(ds.label || 'serie')),
        ];
        const rows: any[][] = (this.data.labels as string[]).map((d: string, i: number) => [
          d,
          ...this.data.datasets.map((ds: any) =>
            Array.isArray(ds.data) ? (ds.data[i] ?? '') : ''
          ),
        ]);
        const csv = this.buildCsv(headers, rows);
        this.saveCsv(`dashboard_series_${datePart}_${timePart}.csv`, csv);
      }

      // Split estado (publicadas / no publicadas)
      if (
        this.seriesEntriesSplitData &&
        Array.isArray(this.seriesEntriesSplitData.labels) &&
        Array.isArray(this.seriesEntriesSplitData.datasets)
      ) {
        const headers = [
          'date',
          ...this.seriesEntriesSplitData.datasets.map((ds: any) => String(ds.label || 'valor')),
        ];
        const rows: any[][] = (this.seriesEntriesSplitData.labels as string[]).map(
          (d: string, i: number) => [
            d,
            ...this.seriesEntriesSplitData.datasets.map((ds: any) =>
              Array.isArray(ds.data) ? (ds.data[i] ?? '') : ''
            ),
          ]
        );
        const csv = this.buildCsv(headers, rows);
        this.saveCsv(`dashboard_series_split_estado_${datePart}_${timePart}.csv`, csv);
      }

      // Split estado nombre (pivot)
      if (
        this.seriesEntriesSplitEstadoNombreData &&
        Array.isArray(this.seriesEntriesSplitEstadoNombreData.labels) &&
        Array.isArray(this.seriesEntriesSplitEstadoNombreData.datasets)
      ) {
        const headers = [
          'date',
          ...this.seriesEntriesSplitEstadoNombreData.datasets.map((ds: any) =>
            String(ds.label || 'estado')
          ),
        ];
        const rows: any[][] = (this.seriesEntriesSplitEstadoNombreData.labels as string[]).map(
          (d: string, i: number) => [
            d,
            ...this.seriesEntriesSplitEstadoNombreData.datasets.map((ds: any) =>
              Array.isArray(ds.data) ? (ds.data[i] ?? '') : ''
            ),
          ]
        );
        const csv = this.buildCsv(headers, rows);
        this.saveCsv(`dashboard_series_split_estado_nombre_${datePart}_${timePart}.csv`, csv);
      }

      // Top lists
      const makeTopCsv = (items: any[], name: string) => {
        if (!Array.isArray(items) || items.length === 0) return;
        const headers = ['name', 'count'];
        const rows = items.map((it) => [it?.name ?? '', it?.count ?? 0]);
        const csv = this.buildCsv(headers, rows);
        this.saveCsv(`${name}_${datePart}_${timePart}.csv`, csv);
      };
      makeTopCsv(this.topUsers, 'dashboard_top_users');
      makeTopCsv(this.topCategories, 'dashboard_top_categories');
      makeTopCsv(this.topTags, 'dashboard_top_tags');

      // Content stats (entradas por estado)
      if (this.contentStats) {
        const baseHeaders = ['metric', 'value'];
        const baseRows = [
          ['totalUsuarios', this.contentStats.totalUsuarios ?? 0],
          ['totalEntradas', this.contentStats.totalEntradas ?? 0],
          ['totalComentarios', this.contentStats.totalComentarios ?? 0],
          ['totalFicheros', this.contentStats.totalFicheros ?? 0],
          ['storageBytes', this.contentStats.storageBytes ?? 0],
        ];
        this.saveCsv(
          `dashboard_content_stats_${datePart}_${timePart}.csv`,
          this.buildCsv(baseHeaders, baseRows)
        );
        if (this.contentStats.entradasByEstado) {
          const headers = ['estado', 'count'];
          const rows = Object.entries(this.contentStats.entradasByEstado).map(([k, v]) => [
            k,
            Number(v) || 0,
          ]);
          this.saveCsv(
            `dashboard_content_stats_estados_${datePart}_${timePart}.csv`,
            this.buildCsv(headers, rows)
          );
        }
      }

      // Storage
      if (this.storage) {
        const headers = ['metric', 'value'];
        const rows = [
          ['totalFiles', this.storage.totalFiles ?? 0],
          ['storageBytes', this.storage.storageBytes ?? 0],
        ];
        this.saveCsv(`dashboard_storage_${datePart}_${timePart}.csv`, this.buildCsv(headers, rows));
      }

      // Latest entries (si disponible en summary)
      if (Array.isArray(this.latestEntries) && this.latestEntries.length) {
        const headers = ['id', 'titulo', 'fechaCreacion', 'idUsuario', 'estado'];
        const rows = this.latestEntries.map((e) => [
          e.id ?? '',
          e.titulo ?? '',
          e.fechaCreacion ?? '',
          e.idUsuario ?? '',
          e.estado ?? '',
        ]);
        this.saveCsv(
          `dashboard_latest_entries_${datePart}_${timePart}.csv`,
          this.buildCsv(headers, rows)
        );
      }
    } catch {}
  }

  async downloadZip(): Promise<void> {
    try {
      this.exportError = null;
      this.exportingZip = true;
      this.cdr.detectChanges();
      const zip = new JSZip();
      const now = new Date();
      const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const folder = zip.folder(`dashboard_${datePart}_${timePart}`) as JSZip;

      const addFile = (name: string, content: string) => {
        if (folder) folder.file(name, content);
      };

      if (this.data && Array.isArray(this.data.labels) && Array.isArray(this.data.datasets)) {
        const headers = [
          'date',
          ...this.data.datasets.map((ds: any) => String(ds.label || 'serie')),
        ];
        const rows: any[][] = (this.data.labels as string[]).map((d: string, i: number) => [
          d,
          ...this.data.datasets.map((ds: any) =>
            Array.isArray(ds.data) ? (ds.data[i] ?? '') : ''
          ),
        ]);
        addFile('series.csv', this.buildCsv(headers, rows));
      }

      if (
        this.seriesEntriesSplitData &&
        Array.isArray(this.seriesEntriesSplitData.labels) &&
        Array.isArray(this.seriesEntriesSplitData.datasets)
      ) {
        const headers = [
          'date',
          ...this.seriesEntriesSplitData.datasets.map((ds: any) => String(ds.label || 'valor')),
        ];
        const rows: any[][] = (this.seriesEntriesSplitData.labels as string[]).map(
          (d: string, i: number) => [
            d,
            ...this.seriesEntriesSplitData.datasets.map((ds: any) =>
              Array.isArray(ds.data) ? (ds.data[i] ?? '') : ''
            ),
          ]
        );
        addFile('series_split_estado.csv', this.buildCsv(headers, rows));
      }

      if (
        this.seriesEntriesSplitEstadoNombreData &&
        Array.isArray(this.seriesEntriesSplitEstadoNombreData.labels) &&
        Array.isArray(this.seriesEntriesSplitEstadoNombreData.datasets)
      ) {
        const headers = [
          'date',
          ...this.seriesEntriesSplitEstadoNombreData.datasets.map((ds: any) =>
            String(ds.label || 'estado')
          ),
        ];
        const rows: any[][] = (this.seriesEntriesSplitEstadoNombreData.labels as string[]).map(
          (d: string, i: number) => [
            d,
            ...this.seriesEntriesSplitEstadoNombreData.datasets.map((ds: any) =>
              Array.isArray(ds.data) ? (ds.data[i] ?? '') : ''
            ),
          ]
        );
        addFile('series_split_estado_nombre.csv', this.buildCsv(headers, rows));
      }

      const makeTopCsv = (items: any[], base: string) => {
        if (!Array.isArray(items) || items.length === 0) return;
        const headers = ['name', 'count'];
        const rows = items.map((it) => [it?.name ?? '', it?.count ?? 0]);
        addFile(`${base}.csv`, this.buildCsv(headers, rows));
      };
      makeTopCsv(this.topUsers, 'top_users');
      makeTopCsv(this.topCategories, 'top_categories');
      makeTopCsv(this.topTags, 'top_tags');

      if (this.contentStats) {
        const baseHeaders = ['metric', 'value'];
        const baseRows = [
          ['totalUsuarios', this.contentStats.totalUsuarios ?? 0],
          ['totalEntradas', this.contentStats.totalEntradas ?? 0],
          ['totalComentarios', this.contentStats.totalComentarios ?? 0],
          ['totalFicheros', this.contentStats.totalFicheros ?? 0],
          ['storageBytes', this.contentStats.storageBytes ?? 0],
        ];
        addFile('content_stats.csv', this.buildCsv(baseHeaders, baseRows));
        if (this.contentStats.entradasByEstado) {
          const headers = ['estado', 'count'];
          const rows = Object.entries(this.contentStats.entradasByEstado).map(([k, v]) => [
            k,
            Number(v) || 0,
          ]);
          addFile('content_stats_estados.csv', this.buildCsv(headers, rows));
        }
      }

      if (this.storage) {
        const headers = ['metric', 'value'];
        const rows = [
          ['totalFiles', this.storage.totalFiles ?? 0],
          ['storageBytes', this.storage.storageBytes ?? 0],
        ];
        addFile('storage.csv', this.buildCsv(headers, rows));
      }

      if (Array.isArray(this.latestEntries) && this.latestEntries.length) {
        const headers = ['id', 'titulo', 'fechaCreacion', 'idUsuario', 'estado'];
        const rows = this.latestEntries.map((e) => [
          e.id ?? '',
          e.titulo ?? '',
          e.fechaCreacion ?? '',
          e.idUsuario ?? '',
          e.estado ?? '',
        ]);
        addFile('latest_entries.csv', this.buildCsv(headers, rows));
      }

      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      const zipName = `dashboard_csv_${datePart}_${timePart}.zip`;
      saveAs(blob, zipName);
    } catch (e) {
      this.exportError = 'No se pudo generar el ZIP. Intenta las descargas individuales.';
    } finally {
      this.exportingZip = false;
      this.cdr.detectChanges();
    }
  }

  downloadCsvSeries(): void {
    if (this.data && Array.isArray(this.data.labels) && Array.isArray(this.data.datasets)) {
      const now = new Date();
      const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const headers = [
        'date',
        'date_raw',
        ...this.data.datasets.map((ds: any) => String(ds.label || 'serie')),
      ];
      const fmt = (raw: string): string => {
        const g = this.seriesGranularity;
        if (g === 'hour') {
          const p = this.parseBackendDate(raw);
          if (p) {
            const dd = String(p.getDate()).padStart(2, '0');
            const mm = String(p.getMonth() + 1).padStart(2, '0');
            const yy = p.getFullYear();
            const hh = String(p.getHours()).padStart(2, '0');
            const mi = String(p.getMinutes()).padStart(2, '0');
            const ss = String(p.getSeconds()).padStart(2, '0');
            return `${dd}-${mm}-${yy} ${hh}:${mi}:${ss}`;
          }
        }
        if (g === 'day') {
          const p = this.parseBackendDate(raw);
          if (p) {
            const dd = String(p.getDate()).padStart(2, '0');
            const mm = String(p.getMonth() + 1).padStart(2, '0');
            const yy = p.getFullYear();
            return `${dd}-${mm}-${yy}`;
          }
        }
        if (g === 'week') {
          const p = this.parseBackendDate(raw);
          if (p) {
            const day = p.getDay();
            const start = new Date(p.getFullYear(), p.getMonth(), p.getDate() - day);
            const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
            const s = `${String(start.getDate()).padStart(2, '0')}-${String(start.getMonth() + 1).padStart(2, '0')}-${start.getFullYear()}`;
            const e = `${String(end.getDate()).padStart(2, '0')}-${String(end.getMonth() + 1).padStart(2, '0')}-${end.getFullYear()}`;
            return `${s} - ${e}`;
          }
        }
        if (g === 'month') {
          const label = this.formatLabelFromDate(raw, 'month', this.isSmallScreen());
          return label;
        }
        return raw;
      };
      const rows: any[][] = (this.dataRawLabels as string[]).map((raw: string, i: number) => [
        fmt(raw),
        raw,
        ...this.data.datasets.map((ds: any) => (Array.isArray(ds.data) ? (ds.data[i] ?? '') : '')),
      ]);
      this.saveCsv(`dashboard_series_${datePart}_${timePart}.csv`, this.buildCsv(headers, rows));
    }
  }

  downloadCsvSeriesSplitEstado(): void {
    if (
      this.seriesEntriesSplitData &&
      Array.isArray(this.seriesEntriesSplitData.labels) &&
      Array.isArray(this.seriesEntriesSplitData.datasets)
    ) {
      const now = new Date();
      const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const headers = [
        'date',
        'date_raw',
        ...this.seriesEntriesSplitData.datasets.map((ds: any) => String(ds.label || 'valor')),
      ];
      const raw = ((this.seriesEntriesSplitData as any)._rawLabels as string[]) || [];
      const rows: any[][] = raw.map((r: string, i: number) => [
        this.formatLabelFromDate(r, this.seriesGranularity),
        r,
        ...this.seriesEntriesSplitData.datasets.map((ds: any) =>
          Array.isArray(ds.data) ? (ds.data[i] ?? '') : ''
        ),
      ]);
      this.saveCsv(
        `dashboard_series_split_estado_${datePart}_${timePart}.csv`,
        this.buildCsv(headers, rows)
      );
    }
  }

  downloadCsvSeriesSplitEstadoNombre(): void {
    if (
      this.seriesEntriesSplitEstadoNombreData &&
      Array.isArray(this.seriesEntriesSplitEstadoNombreData.labels) &&
      Array.isArray(this.seriesEntriesSplitEstadoNombreData.datasets)
    ) {
      const now = new Date();
      const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const headers = [
        'date',
        'date_raw',
        ...this.seriesEntriesSplitEstadoNombreData.datasets.map((ds: any) =>
          String(ds.label || 'estado')
        ),
      ];
      const raw = ((this.seriesEntriesSplitEstadoNombreData as any)._rawLabels as string[]) || [];
      const rows: any[][] = raw.map((r: string, i: number) => [
        this.formatLabelFromDate(r, this.seriesGranularity),
        r,
        ...this.seriesEntriesSplitEstadoNombreData.datasets.map((ds: any) =>
          Array.isArray(ds.data) ? (ds.data[i] ?? '') : ''
        ),
      ]);
      this.saveCsv(
        `dashboard_series_split_estado_nombre_${datePart}_${timePart}.csv`,
        this.buildCsv(headers, rows)
      );
    }
  }

  downloadCsvTopUsers(): void {
    const now = new Date();
    const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const items = this.topUsers;
    if (!Array.isArray(items) || items.length === 0) return;
    const headers = ['name', 'count'];
    const rows = items.map((it) => [it?.name ?? '', it?.count ?? 0]);
    this.saveCsv(`dashboard_top_users_${datePart}_${timePart}.csv`, this.buildCsv(headers, rows));
  }

  downloadCsvTopCategories(): void {
    const now = new Date();
    const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const items = this.topCategories;
    if (!Array.isArray(items) || items.length === 0) return;
    const headers = ['name', 'count'];
    const rows = items.map((it) => [it?.name ?? '', it?.count ?? 0]);
    this.saveCsv(
      `dashboard_top_categories_${datePart}_${timePart}.csv`,
      this.buildCsv(headers, rows)
    );
  }

  downloadCsvTopTags(): void {
    const now = new Date();
    const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const items = this.topTags;
    if (!Array.isArray(items) || items.length === 0) return;
    const headers = ['name', 'count'];
    const rows = items.map((it) => [it?.name ?? '', it?.count ?? 0]);
    this.saveCsv(`dashboard_top_tags_${datePart}_${timePart}.csv`, this.buildCsv(headers, rows));
  }

  downloadCsvContentStats(): void {
    const now = new Date();
    const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const headers = ['metric', 'value'];
    const rows = [
      ['totalUsuarios', this.contentStats?.totalUsuarios ?? 0],
      ['totalEntradas', this.contentStats?.totalEntradas ?? 0],
      ['totalComentarios', this.contentStats?.totalComentarios ?? 0],
      ['totalFicheros', this.contentStats?.totalFicheros ?? 0],
      ['storageBytes', this.contentStats?.storageBytes ?? 0],
    ];
    this.saveCsv(
      `dashboard_content_stats_${datePart}_${timePart}.csv`,
      this.buildCsv(headers, rows)
    );
  }

  downloadCsvContentStatsEstados(): void {
    const now = new Date();
    const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const headers = ['estado', 'count'];
    const byEstado = this.contentStats?.entradasByEstado || {};
    const rows =
      Object.keys(byEstado).length > 0
        ? Object.entries(byEstado).map(([k, v]) => [k, Number(v) || 0])
        : [];
    this.saveCsv(
      `dashboard_content_stats_estados_${datePart}_${timePart}.csv`,
      this.buildCsv(headers, rows)
    );
  }

  downloadCsvStorage(): void {
    if (!this.storage) return;
    const now = new Date();
    const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const headers = ['metric', 'value'];
    const rows = [
      ['totalFiles', this.storage.totalFiles ?? 0],
      ['storageBytes', this.storage.storageBytes ?? 0],
    ];
    this.saveCsv(`dashboard_storage_${datePart}_${timePart}.csv`, this.buildCsv(headers, rows));
  }

  downloadCsvLatestEntries(): void {
    if (!Array.isArray(this.latestEntries) || !this.latestEntries.length) return;
    const now = new Date();
    const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const headers = ['id', 'titulo', 'fechaCreacion', 'idUsuario', 'estado'];
    const rows = this.latestEntries.map((e) => [
      e.id ?? '',
      e.titulo ?? '',
      e.fechaCreacion ?? '',
      e.idUsuario ?? '',
      e.estado ?? '',
    ]);
    this.saveCsv(
      `dashboard_latest_entries_${datePart}_${timePart}.csv`,
      this.buildCsv(headers, rows)
    );
  }

  downloadCsvRecentActivity(): void {
    const items = this.recentItems;
    if (!Array.isArray(items) || !items.length) return;
    const now = new Date();
    const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const headers = ['titulo/name', 'fecha', 'estado'];
    const rows = items.map((e: any) => [
      e?.titulo || e?.contenidoCorto || e?.username || e?.name || '',
      e?.fechaCreacion || e?.fechaRegistro || e?.date || '',
      e?.estado || '',
    ]);
    this.saveCsv(
      `dashboard_recent_activity_${datePart}_${timePart}.csv`,
      this.buildCsv(headers, rows)
    );
  }

  loadSeriesEntriesSplitEstado(): void {
    this.loadingSplitEstado = true;
    const sub = this.dashboardFacade
      .getSeriesEntriesSplitEstado(
        this.seriesDays,
        this.seriesGranularity,
        this.forceFromDb === true
      )
      .subscribe({
        next: (arr: any[]) => {
          if (arr && arr.length) {
            // Detectar todos los estados presentes en la serie
            const estados = Array.from(
              new Set(arr.flatMap((p) => Object.keys(p.entradasByEstado || {})))
            );
            const colores = this.colorPalette;
            this.seriesEntriesSplitData = {
              labels: arr.map((p) => this.formatLabelFromDate(p.date)),
              datasets: estados.map((estado, i) => ({
                label: estado,
                backgroundColor: this.colorForLabel(estado, i),
                data: arr.map((p) => Number(p.entradasByEstado?.[estado]) || 0),
              })),
            };
            (this.seriesEntriesSplitData as any)._rawLabels = arr.map((p) => String(p.date || ''));
            this.cdr.detectChanges();
          }
          this.loadingSplitEstado = false;
          this.errorSplitEstado = null;
        },
        error: () => {
          this.loadingSplitEstado = false;
          this.errorSplitEstado = 'Error obteniendo serie por estado';
          this.focusRetry('.retry-btn-split-estado');
        },
      });
    this.subscription.add(sub);
  }

  loadSeriesEntriesSplitEstadoNombre(): void {
    this.loadingSplitEstadoNombre = true;
    const sub = this.dashboardFacade
      .getSeriesEntriesSplitEstadoNombre(
        this.seriesDays,
        this.seriesGranularity,
        this.forceFromDb === true
      )
      .subscribe({
        next: (arr: any[]) => {
          if (arr && arr.length) {
            // Desanidar si los estados vienen en 'entradasByEstado'
            const flatArr = arr.map((p) => {
              if (p.entradasByEstado && typeof p.entradasByEstado === 'object') {
                return { date: p.date, ...p.entradasByEstado };
              }
              return p;
            });
            const labels = flatArr.map((p) => this.formatLabelFromDate(p.date, 'day'));
            const allKeys = new Set<string>();
            flatArr.forEach((p) =>
              Object.keys(p).forEach((k) => {
                if (k !== 'date') allKeys.add(k);
              })
            );
            const keys = Array.from(allKeys);
            const colors = this.colorPalette;
            const datasets = keys.map((k, i) => ({
              label: k,
              backgroundColor: this.colorForLabel(k, i),
              borderColor: this.colorForLabel(k, i),
              fill: false,
              tension: 0.2,
              data: flatArr.map((p) => Number(p[k]) || 0),
            }));
            this.seriesEntriesSplitEstadoNombreData = { labels, datasets };
            (this.seriesEntriesSplitEstadoNombreData as any)._rawLabels = flatArr.map((p) =>
              String(p.date || '')
            );
            this.cdr.detectChanges();
            this.updateEstadoNominalOptions();
          }
          this.loadingSplitEstadoNombre = false;
        },
        error: () => {
          this.errorSplitEstadoNombre = 'Error obteniendo serie por estado nominal';
          this.loadingSplitEstadoNombre = false;
          this.focusRetry('.retry-btn-split-nominal');
        },
      });
    this.subscription.add(sub);
  }

  setEstadoNominalChartType(t: 'line' | 'bar'): void {
    this.estadoNominalChartType = t;
    // Desactivar apilado en línea por estética
    if (t === 'line') this.estadoNominalStacked = false;
    this.updateEstadoNominalOptions();
    if (this.seriesEntriesSplitEstadoNombreData) {
      this.seriesEntriesSplitEstadoNombreData = {
        labels: [...this.seriesEntriesSplitEstadoNombreData.labels],
        datasets: [...this.seriesEntriesSplitEstadoNombreData.datasets],
      };
      this.cdr.detectChanges();
    }
  }

  toggleEstadoNominalStacked(): void {
    this.estadoNominalStacked = !this.estadoNominalStacked;
    this.updateEstadoNominalOptions();
    if (this.seriesEntriesSplitEstadoNombreData) {
      this.seriesEntriesSplitEstadoNombreData = {
        labels: [...this.seriesEntriesSplitEstadoNombreData.labels],
        datasets: [...this.seriesEntriesSplitEstadoNombreData.datasets],
      };
      this.cdr.detectChanges();
    }
  }

  private updateEstadoNominalOptions(): void {
    const stacked = this.estadoNominalChartType === 'bar' && this.estadoNominalStacked;
    this.estadoNominalChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      animation: false,
      scales: {
        x: { stacked },
        y: { stacked },
      },
    };
  }

  get contentEstadoRows(): {
    estado: string;
    total: number;
    porcentaje: number;
  }[] {
    const entries =
      this.contentStats && this.contentStats.entradasByEstado
        ? Object.entries(this.contentStats.entradasByEstado)
        : [];
    const total =
      this.contentStats?.totalEntradas || entries.reduce((acc, [, v]) => acc + (Number(v) || 0), 0);
    return entries
      .map(([k, v]) => {
        const count = Number(v) || 0;
        const pct = total > 0 ? Math.round((count * 1000) / total) / 10 : 0;
        return { estado: k, total: count, porcentaje: pct };
      })
      .sort((a, b) => b.total - a.total);
  }

  private getPeriodDates(days: number): { startDate: string; endDate: string } {
    const now = new Date();
    const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const startMs = end.getTime() - Math.max(1, Number(days) || 30) * 24 * 60 * 60 * 1000;
    const start = new Date(startMs);
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  private populateMockForE2E(): void {
    const labels =
      this.data.labels && Array.isArray(this.data.labels)
        ? this.data.labels.slice(0, 2)
        : ['01-02-2025', '02-02-2025'];
    const raw = ['2025-02-01', '2025-02-02'];
    this.seriesEntriesSplitData = {
      labels,
      datasets: [
        { label: 'PUBLICADA', data: [1, 2] },
        { label: 'NO PUBLICADA', data: [0, 1] },
      ],
      _rawLabels: raw,
    } as any;
    this.seriesEntriesSplitEstadoNombreData = {
      labels,
      datasets: [
        { label: 'PUBLICADA', data: [1, 2] },
        { label: 'NO PUBLICADA', data: [0, 1] },
      ],
      _rawLabels: raw,
    } as any;
    this.topUsers = [
      { name: 'user1', count: 3 },
      { name: 'user2', count: 1 },
    ];
    this.topCategories = [
      { name: 'cat1', count: 5 },
      { name: 'cat2', count: 2 },
    ];
    this.topTags = [
      { name: 'tag1', count: 4 },
      { name: 'tag2', count: 1 },
    ];
    this.contentStats = {
      totalUsuarios: 10,
      totalEntradas: 20,
      totalComentarios: 5,
      totalFicheros: 2,
      storageBytes: 1024,
      entradasByEstado: { PUBLICADA: 15, 'NO PUBLICADA': 5 },
    } as any;
    this.storage = { totalFiles: 12, storageBytes: 2048 } as any;
  }

  private updateContentStatsChart(cs: ContentStatsDTO): void {
    const entries = cs && cs.entradasByEstado ? Object.entries(cs.entradasByEstado) : [];
    const labels = entries.map(([k]) => k);
    const values = entries.map(([, v]) => Number(v) || 0);
    const colors = labels.map((l, i) => this.colorForLabel(l, i));
    this.contentStatsChartData = {
      labels,
      datasets: [
        {
          label: 'Entradas por estado',
          backgroundColor: colors,
          data: values,
        },
      ],
    };
  }

  get sumComentarios(): number {
    try {
      const arr =
        (this.data.datasets && this.data.datasets[1] && (this.data.datasets[1].data as number[])) ||
        [];
      return Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
    } catch {
      return 0;
    }
  }

  get sumEntradas30d(): number {
    try {
      const arrPub =
        (this.seriesEntriesSplitData &&
          this.seriesEntriesSplitData.datasets &&
          this.seriesEntriesSplitData.datasets[0] &&
          (this.seriesEntriesSplitData.datasets[0].data as number[])) ||
        [];
      if (Array.isArray(arrPub) && arrPub.length) {
        return arrPub.reduce((a, b) => a + (Number(b) || 0), 0);
      }
      const arr =
        (this.data.datasets && this.data.datasets[0] && (this.data.datasets[0].data as number[])) ||
        [];
      return Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
    } catch (e) {
      return 0;
    }
  }

  get sumNoPublicadas30d(): number {
    try {
      const arrNo =
        (this.seriesEntriesSplitData &&
          this.seriesEntriesSplitData.datasets &&
          this.seriesEntriesSplitData.datasets[1] &&
          (this.seriesEntriesSplitData.datasets[1].data as number[])) ||
        [];
      return Array.isArray(arrNo) ? arrNo.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
    } catch (e) {
      return 0;
    }
  }

  get sumUsuarios(): number {
    try {
      const arr =
        (this.data.datasets && this.data.datasets[2] && (this.data.datasets[2].data as number[])) ||
        [];
      return Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
    } catch {
      return 0;
    }
  }

  get estadoNominalTotals(): { label: string; total: number }[] {
    try {
      const out: { label: string; total: number }[] = [];
      if (
        this.seriesEntriesSplitEstadoNombreData &&
        Array.isArray(this.seriesEntriesSplitEstadoNombreData.datasets)
      ) {
        for (const ds of this.seriesEntriesSplitEstadoNombreData.datasets) {
          const arr = (ds.data as number[]) || [];
          const total = Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
          out.push({ label: ds.label, total });
        }
        return out;
      }
      const entries =
        this.contentStats && this.contentStats.entradasByEstado
          ? Object.entries(this.contentStats.entradasByEstado)
          : [];
      return entries.map(([k, v]) => ({ label: k, total: Number(v) || 0 }));
    } catch {
      return [];
    }
  }

  get kpiUltimasEntradasColor(): string {
    const v = this.sumEntradasPublicadas;
    if (v <= 0) return 'secondary';
    if (v < 5) return 'warning';
    if (v < 20) return 'info';
    if (v < 50) return 'primary';
    return 'success';
  }

  get kpiComentariosColor(): string {
    const v = this.sumComentarios;
    if (v <= 0) return 'secondary';
    if (v < 10) return 'warning';
    if (v < 30) return 'info';
    if (v < 80) return 'primary';
    return 'success';
  }

  get kpiNuevosUsuariosColor(): string {
    const v = this.sumUsuarios;
    if (v <= 0) return 'secondary';
    if (v < 5) return 'warning';
    if (v < 15) return 'info';
    if (v < 40) return 'primary';
    return 'success';
  }

  get kpiUsuariosTotalColor(): string {
    const v = Number(this.contentStats?.totalUsuarios) || 0;
    if (v <= 0) return 'secondary';
    if (v < 50) return 'warning';
    if (v < 200) return 'info';
    if (v < 1000) return 'primary';
    return 'success';
  }

  get kpiEntradasTotalColor(): string {
    const v = Number(this.contentStats?.totalEntradas) || 0;
    if (v <= 0) return 'secondary';
    if (v < 50) return 'warning';
    if (v < 200) return 'info';
    if (v < 1000) return 'primary';
    return 'success';
  }

  get kpiComentariosTotalColor(): string {
    const v = Number(this.contentStats?.totalComentarios) || 0;
    if (v <= 0) return 'secondary';
    if (v < 50) return 'warning';
    if (v < 200) return 'info';
    if (v < 1000) return 'primary';
    return 'success';
  }

  get kpiFicherosTotalColor(): string {
    const v = Number(this.contentStats?.totalFicheros) || 0;
    if (v <= 0) return 'secondary';
    if (v < 100) return 'warning';
    if (v < 1000) return 'info';
    if (v < 10000) return 'primary';
    return 'success';
  }

  /**
   * Parsear fechas devueltas por el backend en formatos comunes del sistema:
   * - "DD-MM-YYYY HH:mm:ss"
   * - "DD-MM-YYYY"
   * - si ya es ISO o reconocible por Date, devolver directamente
   */
  private parseBackendDate(dateStr?: string): Date | null {
    return parseAllowedDate(dateStr);
  }

  // Formatea etiquetas para el eje del gráfico principal según granularidad:
  // - hour: HH:mm
  // - day: dd/MM/yyyy
  // - week: dd/MM/yyyy - dd/MM/yyyy (domingo a sábado)
  // - month: en móviles 'Ene 2025'; en escritorio 'Enero 2025'
  private formatLabelFromDate(dateStr?: string, granularity?: string, mobile?: boolean): string {
    const s = String(dateStr || '');
    const gran = granularity || this.seriesGranularity;
    const parsed = this.parseBackendDate(s);
    const fmtDMY = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const cap = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str);
    const isMobile = mobile ?? this.isSmallScreen();
    const monthLabel = (year: number, month1to12: number, short: boolean) => {
      const ref = new Date(year, month1to12 - 1, 1);
      let name = new Intl.DateTimeFormat('es-ES', {
        month: short ? 'short' : 'long',
      }).format(ref);
      name = name.replace(/\.$/, '');
      return `${cap(name)} ${year}`;
    };

    if (gran === 'month') {
      let y: number | null = null;
      let m: number | null = null;
      let matched = false;
      const iso = s.match(/^(\d{4})-(\d{2})(?:-\d{2})?/);
      const isoFull = s.match(/^(\d{4})-(\d{2})-(\d{2})T/);
      const myDash = s.match(/^(\d{2})-(\d{4})$/);
      const mySlash = s.match(/^(\d{2})\/(\d{4})$/);
      const yyyymm = s.match(/^(\d{4})(\d{2})$/);
      const dmyDash = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (isoFull) {
        y = Number(isoFull[1]);
        m = Number(isoFull[2]);
        matched = true;
      } else if (iso) {
        y = Number(iso[1]);
        m = Number(iso[2]);
        matched = true;
      } else if (myDash) {
        m = Number(myDash[1]);
        y = Number(myDash[2]);
        matched = true;
      } else if (mySlash) {
        m = Number(mySlash[1]);
        y = Number(mySlash[2]);
        matched = true;
      } else if (yyyymm) {
        y = Number(yyyymm[1]);
        m = Number(yyyymm[2]);
        matched = true;
      } else if (dmyDash) {
        y = Number(dmyDash[3]);
        m = Number(dmyDash[2]);
        matched = true;
      }
      if (matched && y && m && m >= 1 && m <= 12) {
        const label = monthLabel(y, m, isMobile);
        try {
          this.log.debug('formatLabelFromDate(month):', {
            in: s,
            resolved: label,
          });
        } catch {}
        return label;
      }
      if (parsed) {
        const label = monthLabel(parsed.getFullYear(), parsed.getMonth() + 1, isMobile);
        try {
          this.log.debug('formatLabelFromDate(month,fallback):', {
            in: s,
            resolved: label,
          });
        } catch {}
        return label;
      }
      return s;
    }

    if (!parsed) {
      if (gran === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split('-').map(Number);
        return fmtDMY(new Date(y, m - 1, d));
      }
      return s;
    }
    if (gran === 'hour') {
      const dd = String(parsed.getDate()).padStart(2, '0');
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const yyyy = parsed.getFullYear();
      const hh = String(parsed.getHours()).padStart(2, '0');
      const mi = String(parsed.getMinutes()).padStart(2, '0');
      const ss = String(parsed.getSeconds()).padStart(2, '0');
      return `${dd}-${mm}-${yyyy} ${hh}:${mi}:${ss}`;
    }
    if (gran === 'day') {
      const dd = String(parsed.getDate()).padStart(2, '0');
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const yyyy = parsed.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
    if (gran === 'week') {
      const day = parsed.getDay();
      const start = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() - day);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      const sdd = String(start.getDate()).padStart(2, '0');
      const smm = String(start.getMonth() + 1).padStart(2, '0');
      const syy = start.getFullYear();
      const edd = String(end.getDate()).padStart(2, '0');
      const emm = String(end.getMonth() + 1).padStart(2, '0');
      const eyy = end.getFullYear();
      return `${sdd}-${smm}-${syy} - ${edd}-${emm}-${eyy}`;
    }
    return fmtDMY(parsed);
  }

  private isSmallScreen(): boolean {
    try {
      return (window && window.innerWidth && window.innerWidth < 576) || false;
    } catch {
      return false;
    }
  }

  // Restaurado: suma de entradasMesPublicadas (usado por gráficos y splits)
  get sumEntradasPublicadas(): number {
    return Array.isArray(this.entradasMesPublicadas)
      ? this.entradasMesPublicadas.reduce((acc, v) => acc + (v || 0), 0)
      : 0;
  }

  // Nuevo: suma dinámica de la serie principal (para KPI dinámico)
  get sumEntradasSerie(): number {
    const arr =
      this.data &&
      this.data.datasets &&
      this.data.datasets[0] &&
      Array.isArray(this.data.datasets[0].data)
        ? (this.data.datasets[0].data as number[])
        : [];
    return arr.reduce((acc, v) => acc + (Number(v) || 0), 0);
  }

  get sumEntradasNoPublicadas(): number {
    return Array.isArray(this.entradasMesNoPublicadas)
      ? this.entradasMesNoPublicadas.reduce((acc, v) => acc + (v || 0), 0)
      : 0;
  }

  private focusRetry(sel: string): void {
    try {
      setTimeout(() => {
        const el = document.querySelector(sel) as HTMLButtonElement | null;
        if (el) el.focus();
      }, 0);
    } catch {}
  }
}
