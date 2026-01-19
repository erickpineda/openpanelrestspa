import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { UsuarioService } from '@app/core/services/data/usuario.service';
import { Subscription } from 'rxjs';
import { LoggerService } from '@app/core/services/logger.service';
import { DashboardApiService } from '@app/core/services/dashboard-api.service';
import { DashboardFacadeService } from './srv/dashboard-facade.service';
import { LoadingService } from '@app/core/services/ui/loading.service';
import {
  ActivityPointDTO,
  SummaryDTO,
  SummaryEntryDTO,
  TopItemDTO,
  StorageDTO,
  ContentStatsDTO,
} from '@shared/models/dashboard.models';
import { ToastService } from '@app/core/services/ui/toast.service';
import { environment } from '../../../../environments/environment';
import { AuthSyncService } from '@app/core/services/auth/auth-sync.service';
import { OPConstants } from '@shared/constants/op-global.constants';
 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false,
})
export class DashboardComponent implements OnInit, OnDestroy {
  errorSummary: string | null = null;
  errorSplitEstadoNombre: string | null = null;
  getKpiPorEstado(estado: string): number {
    if (this.seriesEntriesSplitData && Array.isArray(this.seriesEntriesSplitData.datasets)) {
      const ds = this.seriesEntriesSplitData.datasets.find((d: any) => d.label === estado);
      if (ds && Array.isArray(ds.data)) {
        return ds.data.reduce((acc: number, v: number) => acc + (Number(v) || 0), 0);
      }
    }
    return 0;
  }
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
  get kpiPublicadas(): number {
    if (this.contentStats && this.contentStats.entradasByEstado) {
      const keys = Object.keys(this.contentStats.entradasByEstado);
      const key = keys.find((k) => k.trim().toUpperCase() === 'PUBLICADA');
      return key ? Number(this.contentStats.entradasByEstado[key]) || 0 : 0;
    }
    return 0;
  }
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
  data: any = { labels: [], datasets: [] };
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
  estadoSplitChartOptions: any;
  seriesChartOptions: any;
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
      const searchFlag = win ? new URLSearchParams(win.location.search).get('metrics') === '1' : false;
      const hash = win ? win.location.hash || '' : '';
      const qm = hash.indexOf('?');
      const hashFlag = qm >= 0 ? new URLSearchParams(hash.substring(qm + 1)).get('metrics') === '1' : false;
      const urlFlag = searchFlag || hashFlag;
      return this.isLocalEnv() && (this.metricsExpanded || urlFlag);
    } catch {
      return false;
    }
  }
  metricsToggle(): void {
    if (!this.isLocalEnv()) return;
    this.metricsExpanded = !this.metricsExpanded;
    try {
      sessionStorage.setItem(OPConstants.Storage.DASH_METRICS_EXPANDED_KEY, this.metricsExpanded ? '1' : '0');
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
      .refreshAll(this.seriesDays, this.seriesGranularity, this.topLimit, force, this.topCustomStartDate, this.topCustomEndDate)
      .subscribe({
        next: ([summary, series, topUsers, topCategories, topTags, storage, contentStats]) => {
          try {
            if (summary) {
              this.totalEntradas = (summary as SummaryDTO).totalEntradas || 0;
              this.cantidadUsuariosActivos = (summary as SummaryDTO).totalUsuarios || 0;
              this.latestEntries = (summary as SummaryDTO).ultimasEntradas || [];
            }
            if (Array.isArray(series)) {
              const points = series as ActivityPointDTO[];
              this.data = {
                labels: points.map((p) => this.formatLabelFromDate(p.date)),
                datasets: [
                  { label: 'Entradas', backgroundColor: '#007bff', data: points.map((p) => p.entradas) },
                  { label: 'Comentarios', backgroundColor: '#ff7f0e', data: points.map((p) => p.comentarios) },
                  { label: 'Usuarios', backgroundColor: '#2ca02c', data: points.map((p) => p.usuarios) },
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
        window.removeEventListener(OPConstants.Events.AUTH_CHANGED, this.onAuthChangedHandler as any);
    } catch {}
  }
  cargarEstadisticas(): void {
    this.loadingService.setGlobalLoading(true);
    this.dashboardApi.getSummary().subscribe({
      next: (summary: SummaryDTO) => {
        this.totalEntradas = summary.totalEntradas || 0;
        this.cantidadUsuariosActivos = summary.totalUsuarios || 0;
        this.latestEntries = summary.ultimasEntradas || [];
        this.cdr.detectChanges();
        this.loadingService.setGlobalLoading(false);
      },
      error: () => {
        this.errorSummary = 'Error obteniendo summary';
      },
    });
  }
  loadTopWidgets(): void {
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
    const subTopUsers = this.dashboardFacade.getTop('users', this.topLimit, false, startDate, endDate).subscribe({
      next: (items: TopItemDTO[]) => {
        this.topUsers = items || [];
        this.loadingTopUsers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTopUsers = false;
        this.errorTopUsers = 'Error obteniendo Top Usuarios';
      },
    });
    const subTopCategories = this.dashboardFacade.getTop('categories', this.topLimit, false, startDate, endDate).subscribe({
      next: (items: TopItemDTO[]) => {
        this.topCategories = items || [];
        this.loadingTopCategories = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTopCategories = false;
        this.errorTopCategories = 'Error obteniendo Top Categorías';
      },
    });
    const subTopTags = this.dashboardFacade.getTop('tags', this.topLimit, false, startDate, endDate).subscribe({
      next: (items: TopItemDTO[]) => {
        this.topTags = items || [];
        this.loadingTopTags = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTopTags = false;
        this.errorTopTags = 'Error obteniendo Top Tags';
      },
    });
    this.subscription.add(subTopUsers);
    this.subscription.add(subTopCategories);
    this.subscription.add(subTopTags);
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
      },
    });
    this.subscription.add(sub);
  }
  loadContentStats(): void {
    this.loadingContentStats = true;
    this.errorContentStats = null;
    const sub = this.dashboardFacade.getContentStats().subscribe({
      next: (cs: ContentStatsDTO) => {
        this.contentStats = cs;
        this.updateContentStatsChart(cs);
        this.loadingContentStats = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingContentStats = false;
        this.errorContentStats = 'Error obteniendo estadísticas de contenido';
      },
    });
    this.subscription.add(sub);
  }
  loadRecentActivity(): void {
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
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorRecent = 'Error obteniendo actividad reciente';
        this.loadingRecent = false;
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
    const sub = this.dashboardFacade.getSeries(this.seriesDays, true, this.seriesGranularity).subscribe({
      next: (points: ActivityPointDTO[]) => {
        this.data = {
          labels: points.map((p) => this.formatLabelFromDate(p.date)),
          datasets: [
            { label: 'Entradas', backgroundColor: '#007bff', data: points.map((p) => p.entradas) },
            { label: 'Comentarios', backgroundColor: '#ff7f0e', data: points.map((p) => p.comentarios) },
            { label: 'Usuarios', backgroundColor: '#2ca02c', data: points.map((p) => p.usuarios) },
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
    const tp = Math.max(1, Math.min(365, Number(this.settings.topPeriodDays) || this.topPeriodDays));
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
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      saveAs(blob, `dashboard_export_${new Date().toISOString()}.json`);
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
  downloadCsv(): void {
    try {
      const now = new Date();
      const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      if (this.data && Array.isArray(this.data.labels) && Array.isArray(this.data.datasets)) {
        const headers = ['date', ...this.data.datasets.map((ds: any) => String(ds.label || 'serie'))];
        const rows: any[][] = (this.data.labels as string[]).map((d: string, i: number) => [
          d,
          ...this.data.datasets.map((ds: any) => (Array.isArray(ds.data) ? (ds.data[i] ?? '') : '')),
        ]);
        const csv = this.buildCsv(headers, rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `dashboard_series_${datePart}_${timePart}.csv`);
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
        const headers = ['date', ...this.data.datasets.map((ds: any) => String(ds.label || 'serie'))];
        const rows: any[][] = (this.data.labels as string[]).map((d: string, i: number) => [
          d,
          ...this.data.datasets.map((ds: any) => (Array.isArray(ds.data) ? (ds.data[i] ?? '') : '')),
        ]);
        addFile('series.csv', this.buildCsv(headers, rows));
      }
      if (this.seriesEntriesSplitData && Array.isArray(this.seriesEntriesSplitData.labels) && Array.isArray(this.seriesEntriesSplitData.datasets)) {
        const headers = ['date', ...this.seriesEntriesSplitData.datasets.map((ds: any) => String(ds.label || 'valor'))];
        const rows: any[][] = (this.seriesEntriesSplitData.labels as string[]).map((d: string, i: number) => [
          d,
          ...this.seriesEntriesSplitData.datasets.map((ds: any) => (Array.isArray(ds.data) ? (ds.data[i] ?? '') : '')),
        ]);
        addFile('series_split_estado.csv', this.buildCsv(headers, rows));
      }
      if (this.seriesEntriesSplitEstadoNombreData && Array.isArray(this.seriesEntriesSplitEstadoNombreData.labels) && Array.isArray(this.seriesEntriesSplitEstadoNombreData.datasets)) {
        const headers = ['date', ...this.seriesEntriesSplitEstadoNombreData.datasets.map((ds: any) => String(ds.label || 'estado'))];
        const rows: any[][] = (this.seriesEntriesSplitEstadoNombreData.labels as string[]).map((d: string, i: number) => [
          d,
          ...this.seriesEntriesSplitEstadoNombreData.datasets.map((ds: any) => (Array.isArray(ds.data) ? (ds.data[i] ?? '') : '')),
        ]);
        addFile('series_split_estado_nombre.csv', this.buildCsv(headers, rows));
      }
      if (Array.isArray(this.topUsers) && this.topUsers.length) {
        addFile('top_users.csv', this.buildCsv(['name', 'count'], this.topUsers.map((t) => [t?.name ?? '', t?.count ?? 0])));
      }
      if (Array.isArray(this.topCategories) && this.topCategories.length) {
        addFile('top_categories.csv', this.buildCsv(['name', 'count'], this.topCategories.map((t) => [t?.name ?? '', t?.count ?? 0])));
      }
      if (Array.isArray(this.topTags) && this.topTags.length) {
        addFile('top_tags.csv', this.buildCsv(['name', 'count'], this.topTags.map((t) => [t?.name ?? '', t?.count ?? 0])));
      }
      if (this.contentStats) {
        addFile('content_stats.csv', this.buildCsv(['metric', 'value'], [
          ['totalUsuarios', this.contentStats.totalUsuarios ?? 0],
          ['totalEntradas', this.contentStats.totalEntradas ?? 0],
          ['totalComentarios', this.contentStats.totalComentarios ?? 0],
          ['totalFicheros', this.contentStats.totalFicheros ?? 0],
          ['storageBytes', this.contentStats.storageBytes ?? 0],
        ]));
        if (this.contentStats.entradasByEstado) {
          const headers = ['estado', 'count'];
          const rows = Object.entries(this.contentStats.entradasByEstado).map(([k, v]) => [k, Number(v) || 0]);
          addFile('content_stats_estados.csv', this.buildCsv(headers, rows));
        }
      }
      if (this.storage) {
        addFile('storage.csv', this.buildCsv(['metric', 'value'], [
          ['totalFiles', this.storage.totalFiles ?? 0],
          ['storageBytes', this.storage.storageBytes ?? 0],
        ]));
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `dashboard_${datePart}_${timePart}.zip`);
      this.exportingZip = false;
      this.cdr.detectChanges();
    } catch (e: any) {
      this.exportError = 'Error generando ZIP';
      this.exportingZip = false;
      this.cdr.detectChanges();
    }
  }
  getPeriodDates(days: number): { startDate: string; endDate: string } {
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - Math.max(1, Math.min(365, Number(days) || 30)));
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { startDate: fmt(start), endDate: fmt(end) };
  }
  updateContentStatsChart(cs: ContentStatsDTO): void {
    const labels = Object.keys(cs.entradasByEstado || {});
    const data = labels.map((k) => Number(cs.entradasByEstado?.[k]) || 0);
    const chart = {
      labels,
      datasets: [{ label: 'Entradas por estado', backgroundColor: labels.map((l, i) => this.colorForLabel(l, i)), data }],
    };
    this.contentStatsChartData = chart;
    try {
      setTimeout(() => {
        this.contentStatsChartData = { ...chart };
        this.cdr.detectChanges();
      }, 0);
    } catch {}
  }
  get contentEstadoRows(): { estado: string; total: number; porcentaje: number }[] {
    const entries = this.contentStats && (this.contentStats as any).entradasByEstado ? Object.entries((this.contentStats as any).entradasByEstado) : [];
    const total = (this.contentStats as any)?.totalEntradas || entries.reduce((acc, [, v]) => acc + (Number(v) || 0), 0);
    return entries
      .map(([k, v]) => {
        const count = Number(v) || 0;
        const pct = total > 0 ? Math.round((count * 1000) / total) / 10 : 0;
        return { estado: k, total: count, porcentaje: pct };
      })
      .sort((a, b) => b.total - a.total);
  }
  onChangeTopLimit(limit: number): void {
    const l = Math.max(1, Math.min(200, Number(limit) || 10));
    this.topLimit = l;
    this.loadTopWidgets();
  }
  loadSeriesEntriesSplitEstado(): void {
    this.loadingSplitEstado = true;
    this.errorSplitEstado = null;
    const sub = this.dashboardFacade.getSeriesEntriesSplitEstado(this.seriesDays, this.seriesGranularity, true).subscribe({
      next: (arr: any[]) => {
        const labels = Array.isArray(arr) ? arr.map((p) => this.formatLabelFromDate(p?.date)) : [];
        const hasNested = Array.isArray(arr) && arr.some((p) => p && typeof p.entradasByEstado === 'object');
        if (hasNested) {
          const estados = Array.from(new Set(arr.flatMap((p) => Object.keys(p.entradasByEstado || {}))));
          const datasets = estados.map((estado, i) => ({
            label: estado,
            backgroundColor: this.colorForLabel(estado, i),
            data: arr.map((p) => Number(p.entradasByEstado?.[estado]) || 0),
          }));
          this.seriesEntriesSplitData = { labels, datasets };
        } else {
          const keys = Array.from(new Set(arr.flatMap((p) => Object.keys(p || {}).filter((k) => k !== 'date'))));
          const datasets = keys.map((k, i) => ({
            label: String(k).toUpperCase(),
            backgroundColor: this.colorForLabel(k, i),
            data: arr.map((p) => Number(p?.[k] || 0)),
          }));
          this.seriesEntriesSplitData = { labels, datasets };
        }
        try {
          setTimeout(() => {
            this.seriesEntriesSplitData = {
              labels: [...labels],
              datasets: (this.seriesEntriesSplitData.datasets || []).map((d: any) => ({ ...d, data: [...d.data] })),
            };
            this.cdr.detectChanges();
          }, 0);
        } catch {}
        this.loadingSplitEstado = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingSplitEstado = false;
        this.errorSplitEstado = 'Error obteniendo series por estado';
      },
    });
    this.subscription.add(sub);
  }
  loadSeriesEntriesSplitEstadoNombre(): void {
    this.errorSplitEstadoNombre = null;
    const sub = this.dashboardFacade.getSeriesEntriesSplitEstadoNombre(this.seriesDays, this.seriesGranularity, true).subscribe({
      next: (arr: any[]) => {
        const flatArr = Array.isArray(arr)
          ? arr.map((p) => (p && typeof p.entradasByEstado === 'object' ? { date: p.date, ...p.entradasByEstado } : p))
          : [];
        const labels = flatArr.map((p) => this.formatLabelFromDate(p?.date));
        const estadosSet = new Set<string>();
        flatArr.forEach((p) => Object.keys(p || {}).forEach((k) => k !== 'date' && estadosSet.add(k)));
        const estados = Array.from(estadosSet);
        const datasets = estados.map((e, i) => ({
          label: String(e),
          backgroundColor: this.colorForLabel(e, i),
          borderColor: this.colorForLabel(e, i),
          fill: false,
          tension: 0.2,
          data: flatArr.map((r) => Number(r?.[e] || 0)),
        }));
        const chart = { labels, datasets };
        this.seriesEntriesSplitEstadoNombreData = chart;
        this.updateEstadoNominalOptions();
        try {
          setTimeout(() => {
            this.seriesEntriesSplitEstadoNombreData = {
              labels: [...labels],
              datasets: datasets.map((d) => ({ ...d, data: [...d.data] })),
            };
            this.cdr.detectChanges();
          }, 0);
        } catch {}
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorSplitEstadoNombre = 'Error obteniendo series pivot por estado';
      },
    });
    this.subscription.add(sub);
  }
  updateEstadoNominalOptions(): void {
    this.estadoNominalChartOptions = {
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      responsive: true,
      scales: this.estadoNominalChartType === 'bar' ? { x: { stacked: this.estadoNominalStacked }, y: { stacked: this.estadoNominalStacked } } : {},
    };
  }
  setEstadoNominalChartType(t: 'line' | 'bar'): void {
    this.estadoNominalChartType = t;
    this.updateEstadoNominalOptions();
  }
  toggleEstadoNominalStacked(): void {
    this.estadoNominalStacked = !this.estadoNominalStacked;
    this.updateEstadoNominalOptions();
  }
  formatLabelFromDate(dateStr: string, granularity: 'hour' | 'day' | 'week' | 'month' = this.seriesGranularity, short = true): string {
    try {
      const d = new Date(dateStr + 'T00:00:00Z');
      const opts: Intl.DateTimeFormatOptions =
        granularity === 'month'
          ? { month: 'short' }
          : granularity === 'week'
          ? { day: '2-digit', month: 'short' }
          : { day: '2-digit', month: 'short' };
      return new Intl.DateTimeFormat('es-ES', opts).format(d);
    } catch {
      return dateStr;
    }
  }
  get sumEntradasSerie(): number {
    try {
      const arr = this.data && this.data.datasets && this.data.datasets[0] && Array.isArray(this.data.datasets[0].data)
        ? (this.data.datasets[0].data as number[])
        : [];
      return arr.reduce((acc, v) => acc + (Number(v) || 0), 0);
    } catch {
      return 0;
    }
  }
  get sumComentarios(): number {
    try {
      const arr = this.data && this.data.datasets && this.data.datasets[1] && Array.isArray(this.data.datasets[1].data)
        ? (this.data.datasets[1].data as number[])
        : [];
      return arr.reduce((acc, v) => acc + (Number(v) || 0), 0);
    } catch {
      return 0;
    }
  }
  get sumUsuarios(): number {
    try {
      const arr = this.data && this.data.datasets && this.data.datasets[2] && Array.isArray(this.data.datasets[2].data)
        ? (this.data.datasets[2].data as number[])
        : [];
      return arr.reduce((acc, v) => acc + (Number(v) || 0), 0);
    } catch {
      return 0;
    }
  }
}
