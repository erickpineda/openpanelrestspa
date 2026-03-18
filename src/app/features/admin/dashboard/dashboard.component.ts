import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '@app/core/services/translation.service';

import { AuthSyncService } from '@app/core/services/auth/auth-sync.service';
import { DashboardFacadeService } from './srv/dashboard-facade.service';
import { DashboardExportService } from './srv/dashboard-export.service';
import { DashboardChartService } from './srv/dashboard-chart.service';
import { DashboardConfigService } from './srv/dashboard-config.service';
import { LoadingService } from '@app/core/services/ui/loading.service';
import { LoggerService } from '@app/core/services/logger.service';
import { ToastService } from '@app/core/services/ui/toast.service';

import {
  ActivityPointDTO,
  ContentStatsDTO,
  StorageDTO,
  SummaryDTO,
  SummaryEntryDTO,
  TopItemDTO,
} from '@shared/models/dashboard.models';

import { environment } from '../../../../environments/environment';
import { OPConstants } from '@shared/constants/op-global.constants';

/**
 * Componente principal del Dashboard de Administración.
 *
 * Responsabilidades:
 * - Orquestar la carga de datos (Resumen, Series, Tops, Almacenamiento, Estadísticas).
 * - Gestionar la interacción del usuario (Filtros de fechas, granularidad, configuración).
 * - Delegar la lógica de negocio a `DashboardFacadeService`.
 * - Delegar la generación de gráficas a `DashboardChartService`.
 * - Delegar la exportación de datos a `DashboardExportService`.
 * - Delegar la configuración inicial a `DashboardConfigService`.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false,
})
export class DashboardComponent implements OnInit, OnDestroy {
  // #region State & UI Flags
  // Internal UI state flags - Not candidates for external config
  metricsExpanded = false;
  forceFromDb = false;
  showSettingsModal = false;
  exportingZip = false;
  // #endregion

  // #region Loading Flags
  // Transient loading states - Not candidates for external config
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
  // #endregion

  // #region Error Flags
  // Transient error states - Not candidates for external config
  errorSummary: string | null = null;
  errorRecent: string | null = null;
  errorTopUsers: string | null = null;
  errorTopCategories: string | null = null;
  errorTopTags: string | null = null;
  errorStorage: string | null = null;
  errorContentStats: string | null = null;
  errorSplitEstado: string | null = null;
  errorSplitEstadoNombre: string | null = null;
  exportError: string | null = null;
  clearFeedback: string | null = null;
  // #endregion

  // #region Data Containers
  // Dynamic data containers - Not candidates for external config
  totalEntradas = 0;
  cantidadUsuariosActivos = 0;
  latestEntries: SummaryEntryDTO[] = [];
  recentItems: any[] = [];
  topUsers: TopItemDTO[] = [];
  topCategories: TopItemDTO[] = [];
  topTags: TopItemDTO[] = [];
  storage?: StorageDTO;
  contentStats?: ContentStatsDTO;
  // #endregion

  // #region Chart Data & Options
  data: any = { labels: [], datasets: [] };
  seriesEntriesSplitData: any;
  seriesEntriesSplitEstadoNombreData: any;
  contentStatsChartData: any;

  estadoNominalChartOptions: any;
  estadoSplitChartOptions: any;

  estadoNominalChartType: 'line' | 'bar';
  estadoNominalStacked: boolean;
  // #endregion

  // #region Configuration
  // Initialized from DashboardConfigService
  seriesDays: number;
  seriesGranularity: 'hour' | 'day' | 'week' | 'month';
  topLimit: number;
  topPeriodDays: number;
  recentSize: number;

  topCustomStartDate?: string;
  topCustomEndDate?: string;
  recentPage = 0;
  recentTotalPages = 0;

  settings: {
    seriesDays: number;
    seriesGranularity: 'hour' | 'day' | 'week' | 'month';
    topLimit: number;
    topPeriodDays: number;
    topStartDate?: string;
    topEndDate?: string;
  };
  // #endregion

  // #region Performance
  perf: Record<string, number> = {};
  perfUpdatedAt: Date | null = null;
  // #endregion

  // #region Private Properties
  private subscription = new Subscription();
  private onAuthChangedHandler?: (ev: any) => void;
  private settingsInitial: typeof this.settings | null = null;
  // #endregion

  constructor(
    private cdr: ChangeDetectorRef,
    private log: LoggerService,
    private dashboardFacade: DashboardFacadeService,
    private dashboardExport: DashboardExportService,
    private chartService: DashboardChartService,
    private configService: DashboardConfigService,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private authSync: AuthSyncService,
    private translate: TranslationService
  ) {
    const config = this.configService.config;
    this.seriesDays = config.seriesDays;
    this.seriesGranularity = config.seriesGranularity;
    this.topLimit = config.topLimit;
    this.topPeriodDays = config.topPeriodDays;
    this.recentSize = config.recentSize;
    this.estadoNominalChartType = config.estadoNominalChartType;
    this.estadoNominalStacked = config.estadoNominalStacked;

    this.settings = {
      seriesDays: this.seriesDays,
      seriesGranularity: this.seriesGranularity,
      topLimit: this.topLimit,
      topPeriodDays: this.topPeriodDays,
    };
  }

  // #region Lifecycle Hooks
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
  // #endregion

  // #region Getters (KPIs)
  get kpiPublicadas(): number {
    return this.chartService.calculateKpiPublicadas(this.contentStats);
  }

  get kpiNoPublicadas(): number {
    return this.chartService.calculateKpiNoPublicadas(this.contentStats);
  }

  get sumEntradasSerie(): number {
    return this.chartService.calculateSumSeries(this.data, 0);
  }

  get sumComentarios(): number {
    return this.chartService.calculateSumSeries(this.data, 1);
  }

  get sumUsuarios(): number {
    return this.chartService.calculateSumSeries(this.data, 2);
  }

  get contentEstadoRows(): { estado: string; total: number; porcentaje: number }[] {
    return this.chartService.calculateContentEstadoRows(this.contentStats);
  }

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
  // #endregion

  // #region Data Loading Methods
  refreshDashboard(): void {
    this.loadAllDashboardData(this.forceFromDb === true);
  }

  private loadAllDashboardData(force: boolean = true): void {
    const t0 = Date.now();
    this.loadingService.registerRetryHandler(() => this.loadAllDashboardData(true));
    this.loadingService.setGlobalLoading(true);
    this.loadingSeries = true;
    this.errorSummary = null;
    if (!force) {
      try {
        this.dashboardFacade.evictSummary();
        this.dashboardFacade.evictSeries(this.seriesDays);
        this.dashboardFacade.evictTop();
        this.dashboardFacade.evictContentStats();
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
              const points = series as ActivityPointDTO[];
              this.data = this.chartService.generateMainSeriesChart(points);
            }
            this.topUsers = Array.isArray(topUsers) ? topUsers : this.topUsers;
            this.topCategories = Array.isArray(topCategories) ? topCategories : this.topCategories;
            this.topTags = Array.isArray(topTags) ? topTags : this.topTags;
            this.storage = storage as StorageDTO;
            this.contentStats = contentStats as ContentStatsDTO;
            if (contentStats && (contentStats as ContentStatsDTO).entradasByEstado) {
              this.contentStatsChartData = this.chartService.generateContentStatsChart(
                contentStats as ContentStatsDTO
              );
            }
            this.loadSeriesEntriesSplitEstado();
            this.loadSeriesEntriesSplitEstadoNombre();
            this.toastService.showSuccess(
              this.translate.instant('ADMIN.DASHBOARD.SUCCESS.UPDATED'),
              this.translate.instant('MENU.DASHBOARD')
            );
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
          this.errorSummary = this.translate.instant('ADMIN.DASHBOARD.ERROR.REFRESH_DASHBOARD');
          this.log.error('Error refrescando dashboard', err);
          this.loadingSeries = false;
          this.loadingService.forceStopLoading();
        },
      });
    this.subscription.add(sub);
  }

  loadTopWidgets(): void {
    this.loadingTopUsers = true;
    this.loadingTopCategories = true;
    this.loadingTopTags = true;
    this.errorTopUsers = null;
    this.errorTopCategories = null;
    this.errorTopTags = null;
    const { startDate, endDate } = this.getEffectiveTopDateRange();

    const sub = this.dashboardFacade
      .refreshTopWidgets(this.topLimit, this.forceFromDb, startDate, endDate)
      .subscribe({
        next: ([users, categories, tags]) => {
          this.topUsers = users || [];
          this.topCategories = categories || [];
          this.topTags = tags || [];
          this.loadingTopUsers = false;
          this.loadingTopCategories = false;
          this.loadingTopTags = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingTopUsers = false;
          this.loadingTopCategories = false;
          this.loadingTopTags = false;
          this.errorTopUsers = this.translate.instant('ADMIN.DASHBOARD.ERROR.TOP_USERS');
          this.errorTopCategories = this.translate.instant('ADMIN.DASHBOARD.ERROR.TOP_CATEGORIES');
          this.errorTopTags = this.translate.instant('ADMIN.DASHBOARD.ERROR.TOP_TAGS');
        },
      });
    this.subscription.add(sub);
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
        this.errorStorage = this.translate.instant('ADMIN.DASHBOARD.ERROR.STORAGE');
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
        this.contentStatsChartData = this.chartService.generateContentStatsChart(cs);
        this.loadingContentStats = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingContentStats = false;
        this.errorContentStats = this.translate.instant('ADMIN.DASHBOARD.ERROR.CONTENT_STATS');
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
        this.errorRecent = this.translate.instant('ADMIN.DASHBOARD.ERROR.RECENT_ACTIVITY');
        this.loadingRecent = false;
      },
    });
    this.subscription.add(sub);
  }

  loadSeriesEntriesSplitEstado(): void {
    this.loadingSplitEstado = true;
    this.errorSplitEstado = null;
    const sub = this.dashboardFacade
      .getSeriesEntriesSplitEstado(this.seriesDays, this.seriesGranularity, true)
      .subscribe({
        next: (arr: any[]) => {
          const chart = this.chartService.transformSplitEstado(arr);
          this.seriesEntriesSplitData = chart;
          try {
            setTimeout(() => {
              this.seriesEntriesSplitData = {
                labels: [...chart.labels],
                datasets: (this.seriesEntriesSplitData.datasets || []).map((d: any) => ({
                  ...d,
                  data: [...d.data],
                })),
              };
              this.cdr.detectChanges();
            }, 0);
          } catch {}
          this.loadingSplitEstado = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingSplitEstado = false;
          this.errorSplitEstado = this.translate.instant('ADMIN.DASHBOARD.ERROR.SERIES_BY_STATUS');
        },
      });
    this.subscription.add(sub);
  }

  loadSeriesEntriesSplitEstadoNombre(): void {
    this.errorSplitEstadoNombre = null;
    const sub = this.dashboardFacade
      .getSeriesEntriesSplitEstadoNombre(this.seriesDays, this.seriesGranularity, true)
      .subscribe({
        next: (arr: any[]) => {
          const chart = this.chartService.transformSplitEstadoNombre(arr);
          this.seriesEntriesSplitEstadoNombreData = chart;
          this.estadoNominalChartOptions = this.chartService.getEtatNominalOptions(
            this.estadoNominalStacked
          );
          try {
            setTimeout(() => {
              this.seriesEntriesSplitEstadoNombreData = {
                labels: [...chart.labels],
                datasets: chart.datasets.map((d: any) => ({ ...d, data: [...d.data] })),
              };
              this.cdr.detectChanges();
            }, 0);
          } catch {}
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorSplitEstadoNombre = this.translate.instant(
            'ADMIN.DASHBOARD.ERROR.SERIES_PIVOT'
          );
        },
      });
    this.subscription.add(sub);
  }
  // #endregion

  // #region UI Action Methods
  changeSeriesDays(days: number): void {
    const d = Math.max(1, Math.min(365, Number(days) || this.configService.config.seriesDays));
    this.seriesDays = d;
    const sub = this.dashboardFacade
      .getSeries(this.seriesDays, true, this.seriesGranularity)
      .subscribe({
        next: (points: ActivityPointDTO[]) => {
          this.data = this.chartService.generateMainSeriesChart(points);
          this.cdr.detectChanges();
        },
      });
    this.subscription.add(sub);
    this.loadSeriesEntriesSplitEstado();
    this.loadSeriesEntriesSplitEstadoNombre();
    this.estadoNominalChartOptions = this.chartService.getEtatNominalOptions(
      this.estadoNominalStacked
    );
  }

  changeSeriesGranularity(g: 'hour' | 'day' | 'week' | 'month'): void {
    this.seriesGranularity = g;
    this.changeSeriesDays(this.seriesDays);
  }

  onChangeTopLimit(limit: number): void {
    const l = Math.max(1, Math.min(200, Number(limit) || this.configService.config.topLimit));
    this.topLimit = l;
    this.loadTopWidgets();
  }

  onRecentPageChange(page: number): void {
    this.recentPage = page;
    this.loadRecentActivity();
  }

  onRecentSizeChange(size: number): void {
    const s = Math.max(1, Math.min(200, Number(size) || this.configService.config.recentSize));
    this.recentSize = s;
    this.recentPage = 0;
    this.loadRecentActivity();
  }

  setEstadoNominalChartType(t: 'line' | 'bar'): void {
    this.estadoNominalChartType = t;
    this.estadoNominalChartOptions = this.chartService.getEtatNominalOptions(
      this.estadoNominalStacked
    );
  }

  toggleEstadoNominalStacked(): void {
    this.estadoNominalStacked = !this.estadoNominalStacked;
    this.estadoNominalChartOptions = this.chartService.getEtatNominalOptions(
      this.estadoNominalStacked
    );
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

  async copyPerfToClipboard(): Promise<void> {
    try {
      const payload = {
        updatedAt: this.perfUpdatedAt ? this.perfUpdatedAt.toISOString() : null,
        perf: this.perf,
      };
      const text = JSON.stringify(payload, null, 2);
      if (navigator && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        this.toastService.showSuccess(
          this.translate.instant('ADMIN.DASHBOARD.METRICS.COPIED'),
          this.translate.instant('MENU.DASHBOARD')
        );
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch {
      this.toastService.showError(
        this.translate.instant('ADMIN.DASHBOARD.METRICS.COPY_ERROR'),
        this.translate.instant('MENU.DASHBOARD')
      );
    }
  }
  // #endregion

  // #region Settings Modal Methods
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
    const config = this.configService.config;
    this.settings = {
      seriesDays: config.seriesDays,
      seriesGranularity: config.seriesGranularity,
      topLimit: config.topLimit,
      topPeriodDays: config.topPeriodDays,
      topStartDate: undefined,
      topEndDate: undefined,
    };
    this.clearFeedback = this.translate.instant('ADMIN.DASHBOARD.SETTINGS_MODAL.RESET_FEEDBACK');
    this.cdr.detectChanges();
  }
  // #endregion

  // #region Export & Download Methods
  private safeDownload<T>(
    data: T | undefined | null,
    isValid: (d: T) => boolean,
    action: (d: T) => void,
    warningMsg: string,
    errorMsg: string
  ): void {
    try {
      if (data && isValid(data)) {
        action(data);
      } else {
        this.toastService.showWarning(warningMsg, this.translate.instant('MENU.DASHBOARD'));
      }
      this.cdr.detectChanges();
    } catch (e) {
      console.error(`Dashboard: ${errorMsg}`, e);
      this.toastService.showError(errorMsg, this.translate.instant('MENU.DASHBOARD'));
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
      this.dashboardExport.downloadCurrentData(payload);
    } catch {}
  }

  downloadCsv(): void {
    this.safeDownload(
      this.data,
      (d) => d && d.labels && d.labels.length > 0,
      (d) => this.dashboardExport.downloadCsv(d),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.NO_DATA_SERIES'),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.ERROR_SERIES')
    );
  }

  downloadRecentCsv(): void {
    this.safeDownload(
      this.recentItems,
      (d) => d && d.length > 0,
      (d) => this.dashboardExport.downloadRecentActivityCsv(d),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.NO_DATA_RECENT'),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.ERROR_RECENT')
    );
  }

  downloadSplitEstadoCsv(): void {
    this.safeDownload(
      this.seriesEntriesSplitData,
      (d) => d && d.labels && d.labels.length > 0,
      (d) => this.dashboardExport.downloadSeriesSplitEstadoCsv(d),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.NO_DATA_SPLIT'),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.ERROR_SPLIT')
    );
  }

  downloadSplitEstadoNombreCsv(): void {
    this.safeDownload(
      this.seriesEntriesSplitEstadoNombreData,
      (d) => d && d.labels && d.labels.length > 0,
      (d) => this.dashboardExport.downloadSeriesSplitEstadoNombreCsv(d),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.NO_DATA_NOMINAL'),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.ERROR_NOMINAL')
    );
  }

  downloadStorageCsv(): void {
    this.safeDownload(
      this.storage,
      (d) => !!d,
      (d) => this.dashboardExport.downloadStorageCsv(d),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.NO_DATA_STORAGE'),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.ERROR_STORAGE')
    );
  }

  downloadContentStatsCsv(): void {
    this.safeDownload(
      this.contentStats,
      (d) => !!d,
      (d) => this.dashboardExport.downloadContentStatsCsv(d),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.NO_DATA_CONTENT'),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.ERROR_CONTENT')
    );
  }

  downloadContentStatsEstadosCsv(): void {
    this.safeDownload(
      this.contentStats,
      (d) => !!(d && d.entradasByEstado),
      (d) => this.dashboardExport.downloadContentStatsEstadosCsv(d),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.NO_DATA_CONTENT_STATUS'),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.ERROR_CONTENT_STATUS')
    );
  }

  downloadTopUsuariosCsv(): void {
    this.safeDownload(
      this.topUsers,
      (d) => d && d.length > 0,
      (d) => this.dashboardExport.downloadTopUsersCsv(d),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.NO_DATA_TOP_USERS'),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.ERROR_TOP_USERS')
    );
  }

  downloadTopCategoriasCsv(): void {
    this.safeDownload(
      this.topCategories,
      (d) => d && d.length > 0,
      (d) => this.dashboardExport.downloadTopCategoriesCsv(d),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.NO_DATA_TOP_CATEGORIES'),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.ERROR_TOP_CATEGORIES')
    );
  }

  downloadTopTagsCsv(): void {
    this.safeDownload(
      this.topTags,
      (d) => d && d.length > 0,
      (d) => this.dashboardExport.downloadTopTagsCsv(d),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.NO_DATA_TOP_TAGS'),
      this.translate.instant('ADMIN.DASHBOARD.DOWNLOAD.ERROR_TOP_TAGS')
    );
  }

  async downloadZip(): Promise<void> {
    try {
      this.exportError = null;
      this.exportingZip = true;
      this.cdr.detectChanges();
      await this.dashboardExport.downloadZip(
        this.data,
        this.seriesEntriesSplitData,
        this.seriesEntriesSplitEstadoNombreData,
        this.topUsers,
        this.topCategories,
        this.topTags,
        this.contentStats,
        this.storage
      );
      this.exportingZip = false;
      this.cdr.detectChanges();
    } catch (e: any) {
      this.exportError = this.translate.instant('ADMIN.DASHBOARD.ERROR.ZIP_GENERATION');
      this.exportingZip = false;
      this.cdr.detectChanges();
    }
  }
  // #endregion

  // #region Helpers
  /** Formatea bytes a una cadena legible (e.g., "1.5 MB") */
  formatBytes(bytes?: number): string {
    return this.chartService.formatBytes(bytes);
  }

  /** Determina el rango de fechas efectivo para los widgets Top */
  private getEffectiveTopDateRange(): { startDate: string; endDate: string } {
    if (this.topCustomStartDate && this.topCustomEndDate) {
      return { startDate: this.topCustomStartDate, endDate: this.topCustomEndDate };
    }
    return this.chartService.getPeriodDates(this.topPeriodDays);
  }

  /** Inicializa la gráfica principal con datos vacíos */
  private initDefaultData(): void {
    this.data = this.chartService.generateEmptyMainSeriesChart(this.seriesDays);
  }

  /** Registra métricas de rendimiento internas */
  private markPerf(t0: number, name: string): void {
    try {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = Math.round(now - t0);
      this.perf[name] = elapsed;
      this.perfUpdatedAt = new Date();
    } catch {}
  }

  /** Verifica si el entorno actual es desarrollo local */
  public isLocalEnv(): boolean {
    return (environment as any).production === false;
  }

  /** Valida que el rango de fechas sea lógico (start <= end) */
  private isValidDateRange(s: string, e: string): boolean {
    try {
      const sd = new Date(s + 'T00:00:00Z');
      const ed = new Date(e + 'T00:00:00Z');
      return !isNaN(sd.getTime()) && !isNaN(ed.getTime()) && sd.getTime() <= ed.getTime();
    } catch {
      return false;
    }
  }
  // #endregion
}
