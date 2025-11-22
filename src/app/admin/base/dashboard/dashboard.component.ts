import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { EntradaService } from '../../../core/services/data/entrada.service';
import { UsuarioService } from '../../../core/services/data/usuario.service';
import { Subscription, forkJoin } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';
import { DashboardApiService } from '../../../core/services/dashboard-api.service';
import { LoadingService } from '../../../core/services/ui/loading.service';
import { ActivityPointDTO, SummaryDTO, SummaryEntryDTO, TopItemDTO, StorageDTO, ContentStatsDTO } from '../../../shared/models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

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

  data = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    datasets: [
      {
        label: 'Entradas Publicadas',
        backgroundColor: '#007bff',
        data: this.entradasMesPublicadas
      },
      {
        label: 'Entradas No Publicadas',
        backgroundColor: '#ff0000',
        data: this.entradasMesNoPublicadas
      }
    ]
  };

  seriesDays = 30;
  seriesGranularity: 'day' | 'week' | 'month' = 'day';
  seriesEntriesSplitData: any;
  seriesEntriesSplitEstadoNombreData: any;
  estadoNominalChartType: 'line' | 'bar' = 'bar';
  estadoNominalStacked = true;
  estadoNominalChartOptions: any;
  topPeriodDays = 30;

  private subscription: Subscription = new Subscription();

  constructor(
    private usuarioService: UsuarioService,
    private entradaService: EntradaService,
    private cdr: ChangeDetectorRef,
    private log: LoggerService,
    private dashboardApi: DashboardApiService,
    private loadingService: LoadingService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarEstadisticas();
    this.loadTopWidgets();
    this.loadStorage();
    this.loadContentStats();
    this.loadRecentActivity();
    this.loadSeriesEntriesSplitEstado();
    this.loadSeriesEntriesSplitEstadoNombre();
    this.updateEstadoNominalOptions();
  }

  refreshDashboard(): void {
    this.loadingService.setGlobalLoading(true);
    const summary$ = this.dashboardApi.getSummary(true);
    const series$ = this.dashboardApi.getSeriesActivity(this.seriesDays, true, this.seriesGranularity);
    const topUsers$ = this.dashboardApi.getTop('users', this.topLimit, true);
    const topCategories$ = this.dashboardApi.getTop('categories', this.topLimit, true);
    const storage$ = this.dashboardApi.getStorage();
    const contentStats$ = this.dashboardApi.getContentStats();

    const topTags$ = this.dashboardApi.getTop('tags', this.topLimit, true);
    const sub = forkJoin([summary$, series$, topUsers$, topCategories$, topTags$, storage$, contentStats$]).subscribe({
      next: ([summary, series, topUsers, topCategories, topTags, storage, contentStats]) => {
        try {
          if (summary) {
            this.totalEntradas = (summary as SummaryDTO).totalEntradas || 0;
            this.cantidadUsuariosActivos = (summary as SummaryDTO).totalUsuarios || 0;
            this.latestEntries = (summary as SummaryDTO).ultimasEntradas || [];
          }

          if (Array.isArray(series)) {
            this.data = {
              labels: (series as ActivityPointDTO[]).map(p => p.date),
              datasets: [
                { label: 'Entradas', backgroundColor: '#007bff', data: (series as ActivityPointDTO[]).map(p => p.entradas) },
                { label: 'Comentarios', backgroundColor: '#ff7f0e', data: (series as ActivityPointDTO[]).map(p => p.comentarios) },
                { label: 'Usuarios', backgroundColor: '#2ca02c', data: (series as ActivityPointDTO[]).map(p => p.usuarios) }
              ]
            };
          }
          this.topUsers = Array.isArray(topUsers) ? topUsers : this.topUsers;
          this.topCategories = Array.isArray(topCategories) ? topCategories : this.topCategories;
          this.topTags = Array.isArray(topTags) ? topTags : this.topTags;
          this.storage = storage as StorageDTO;
          this.contentStats = contentStats as ContentStatsDTO;
          if (contentStats && (contentStats as ContentStatsDTO).entradasByEstado) {
            this.updateContentStatsChart(contentStats as ContentStatsDTO);
          }
          this.cdr.detectChanges();
        } finally {
          this.loadingService.setGlobalLoading(false);
        }
      },
      error: (err) => {
        this.log.error('Error refrescando dashboard', err);
        this.loadingService.forceStopLoading();
      }
    });

    this.subscription.add(sub);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async cargarEstadisticas(): Promise<void> {
    // Preferir endpoint centralizado del backend (summary + series)
    this.loadingService.setGlobalLoading(true);
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
            if (e.estado && e.estado.toUpperCase() === 'PUBLICADA') this.entradasMesPublicadas[mesIdx] += 1;
            else this.entradasMesNoPublicadas[mesIdx] += 1;
          });
        }

        this.actualizarGrafico();
        this.cdr.detectChanges();
      },
      error: (err: any) => this.log.error('Error obteniendo summary', err)
    });

    this.subscription.add(summarySub);

    // Cargar series de actividad para gráfico principal
    const seriesSub = this.dashboardApi.getSeriesActivity(this.seriesDays, false, this.seriesGranularity).subscribe({
      next: (points: ActivityPointDTO[]) => {
        if (points && points.length) {
          this.data = {
            labels: points.map(p => p.date),
            datasets: [
              { label: 'Entradas', backgroundColor: '#007bff', data: points.map(p => p.entradas) },
              { label: 'Comentarios', backgroundColor: '#ff7f0e', data: points.map(p => p.comentarios) },
              { label: 'Usuarios', backgroundColor: '#2ca02c', data: points.map(p => p.usuarios) }
            ]
          };
          this.cdr.detectChanges();
          // Si summary ya terminó, detener loader; lo controlamos también en refresh
          this.loadingService.setGlobalLoading(false);
        }
      },
      error: (err: any) => this.log.error('Error obteniendo series', err)
    });

    this.subscription.add(seriesSub);
  }

  loadTopWidgets(): void {
    this.loadingTopUsers = true;
    this.loadingTopCategories = true;
    this.loadingTopTags = true;
    const { startDate, endDate } = this.getPeriodDates(this.topPeriodDays);
    const subTopUsers = this.dashboardApi.getTop('users', this.topLimit, false, startDate, endDate).subscribe({
      next: (items: TopItemDTO[]) => { this.topUsers = items || []; this.loadingTopUsers = false; this.cdr.detectChanges(); },
      error: () => { this.loadingTopUsers = false; }
    });
    const subTopCategories = this.dashboardApi.getTop('categories', this.topLimit, false, startDate, endDate).subscribe({
      next: (items: TopItemDTO[]) => { this.topCategories = items || []; this.loadingTopCategories = false; this.cdr.detectChanges(); },
      error: () => { this.loadingTopCategories = false; }
    });
    const subTopTags = this.dashboardApi.getTop('tags', this.topLimit, false, startDate, endDate).subscribe({
      next: (items: TopItemDTO[]) => { this.topTags = items || []; this.loadingTopTags = false; this.cdr.detectChanges(); },
      error: () => { this.loadingTopTags = false; }
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
    const sub = this.dashboardApi.getStorage().subscribe({
      next: (s: StorageDTO) => { this.storage = s; this.loadingStorage = false; this.cdr.detectChanges(); },
      error: () => { this.loadingStorage = false; }
    });
    this.subscription.add(sub);
  }

  loadContentStats(): void {
    this.loadingContentStats = true;
    const sub = this.dashboardApi.getContentStats().subscribe({
      next: (cs: ContentStatsDTO) => { this.contentStats = cs; this.updateContentStatsChart(cs); this.loadingContentStats = false; this.cdr.detectChanges(); },
      error: () => { this.loadingContentStats = false; }
    });
    this.subscription.add(sub);
  }

  loadRecentActivity(): void {
    this.loadingRecent = true;
    const sub = this.dashboardApi.getRecentActivity(this.recentPage, this.recentSize).subscribe({
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
          // Fallback: algunos backends devuelven las últimas entradas bajo 'ultimasEntradas'
          this.recentItems = r.ultimasEntradas;
          this.recentTotalPages = 1;
        } else {
          this.recentItems = [];
          this.recentTotalPages = 0;
        }
        this.loadingRecent = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingRecent = false; }
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
    const sub = this.dashboardApi.getSeriesActivity(this.seriesDays, true, this.seriesGranularity).subscribe({
      next: (points: ActivityPointDTO[]) => {
        this.data = {
          labels: points.map(p => p.date),
          datasets: [
            { label: 'Entradas', backgroundColor: '#007bff', data: points.map(p => p.entradas) },
            { label: 'Comentarios', backgroundColor: '#ff7f0e', data: points.map(p => p.comentarios) },
            { label: 'Usuarios', backgroundColor: '#2ca02c', data: points.map(p => p.usuarios) }
          ]
        };
        this.cdr.detectChanges();
      }
    });
    this.subscription.add(sub);
    this.loadSeriesEntriesSplitEstado();
    this.loadSeriesEntriesSplitEstadoNombre();
    this.updateEstadoNominalOptions();
  }

  changeSeriesGranularity(g: 'day' | 'week' | 'month'): void {
    this.seriesGranularity = g;
    this.changeSeriesDays(this.seriesDays);
  }

  loadSeriesEntriesSplitEstado(): void {
    const sub = this.dashboardApi.getSeriesEntriesSplitEstado(this.seriesDays, this.seriesGranularity, true).subscribe({
      next: (arr: any[]) => {
        if (arr && arr.length) {
          this.seriesEntriesSplitData = {
            labels: arr.map(p => p.date),
            datasets: [
              { label: 'Publicadas', backgroundColor: '#1f77b4', data: arr.map(p => Number(p.publicadas) || 0) },
              { label: 'No publicadas', backgroundColor: '#d62728', data: arr.map(p => Number(p.noPublicadas) || 0) }
            ]
          };
          this.cdr.detectChanges();
        }
      }
    });
    this.subscription.add(sub);
  }

  loadSeriesEntriesSplitEstadoNombre(): void {
    const sub = this.dashboardApi.getSeriesEntriesSplitEstadoNombre(this.seriesDays, this.seriesGranularity, true).subscribe({
      next: (arr: any[]) => {
        if (arr && arr.length) {
          const labels = arr.map(p => p.date);
          const allKeys = new Set<string>();
          arr.forEach(p => Object.keys(p).forEach(k => { if (k !== 'date') allKeys.add(k); }));
          const keys = Array.from(allKeys);
          const colors = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ab'];
          const datasets = keys.map((k, i) => ({
            label: k,
            backgroundColor: colors[i % colors.length],
            borderColor: colors[i % colors.length],
            fill: false,
            tension: 0.2,
            data: arr.map(p => Number(p[k]) || 0)
          }));
          this.seriesEntriesSplitEstadoNombreData = { labels, datasets };
          this.cdr.detectChanges();
          this.updateEstadoNominalOptions();
        }
      }
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
        datasets: [...this.seriesEntriesSplitEstadoNombreData.datasets]
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
        datasets: [...this.seriesEntriesSplitEstadoNombreData.datasets]
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
        y: { stacked }
      }
    };
  }

  get contentEstadoRows(): { estado: string, total: number, porcentaje: number }[] {
    const entries = this.contentStats && this.contentStats.entradasByEstado ? Object.entries(this.contentStats.entradasByEstado) : [];
    const total = (this.contentStats?.totalEntradas) || entries.reduce((acc, [, v]) => acc + (Number(v) || 0), 0);
    return entries.map(([k, v]) => {
      const count = Number(v) || 0;
      const pct = total > 0 ? Math.round((count * 1000) / total) / 10 : 0;
      return { estado: k, total: count, porcentaje: pct };
    }).sort((a, b) => b.total - a.total);
  }

  private getPeriodDates(days: number): { startDate: string, endDate: string } {
    const now = new Date();
    const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const startMs = end.getTime() - Math.max(1, Number(days) || 30) * 24 * 60 * 60 * 1000;
    const start = new Date(startMs);
    const fmt = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  private updateContentStatsChart(cs: ContentStatsDTO): void {
    const entries = cs && cs.entradasByEstado ? Object.entries(cs.entradasByEstado) : [];
    const labels = entries.map(([k]) => k);
    const values = entries.map(([, v]) => Number(v) || 0);
    const colors = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ab'];
    this.contentStatsChartData = {
      labels,
      datasets: [
        {
          label: 'Entradas por estado',
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          data: values
        }
      ]
    };
  }

  get sumComentarios(): number {
    try {
      const arr = (this.data.datasets && this.data.datasets[1] && (this.data.datasets[1].data as number[])) || [];
      return Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
    } catch {
      return 0;
    }
  }

  get sumEntradas30d(): number {
    try {
      const arrPub = (this.seriesEntriesSplitData && this.seriesEntriesSplitData.datasets && this.seriesEntriesSplitData.datasets[0] && (this.seriesEntriesSplitData.datasets[0].data as number[])) || [];
      if (Array.isArray(arrPub) && arrPub.length) {
        return arrPub.reduce((a, b) => a + (Number(b) || 0), 0);
      }
      const arr = (this.data.datasets && this.data.datasets[0] && (this.data.datasets[0].data as number[])) || [];
      return Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
    } catch {
      return 0;
    }
  }

  get sumNoPublicadas30d(): number {
    try {
      const arrNo = (this.seriesEntriesSplitData && this.seriesEntriesSplitData.datasets && this.seriesEntriesSplitData.datasets[1] && (this.seriesEntriesSplitData.datasets[1].data as number[])) || [];
      return Array.isArray(arrNo) ? arrNo.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
    } catch {
      return 0;
    }
  }

  get sumUsuarios(): number {
    try {
      const arr = (this.data.datasets && this.data.datasets[2] && (this.data.datasets[2].data as number[])) || [];
      return Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
    } catch {
      return 0;
    }
  }

  get estadoNominalTotals(): { label: string, total: number }[] {
    try {
      const out: { label: string, total: number }[] = [];
      if (this.seriesEntriesSplitEstadoNombreData && Array.isArray(this.seriesEntriesSplitEstadoNombreData.datasets)) {
        for (const ds of this.seriesEntriesSplitEstadoNombreData.datasets) {
          const arr = (ds.data as number[]) || [];
          const total = Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
          out.push({ label: ds.label, total });
        }
        return out;
      }
      const entries = this.contentStats && this.contentStats.entradasByEstado ? Object.entries(this.contentStats.entradasByEstado) : [];
      return entries.map(([k, v]) => ({ label: k, total: Number(v) || 0 }));
    } catch { return []; }
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
    if (!dateStr) return null;
    // Intentar parseo nativo primero
    const native = new Date(dateStr);
    if (!isNaN(native.getTime())) return native;

    // Intentar formato 'DD-MM-YYYY HH:mm:ss' o 'DD-MM-YYYY'
    // Separar fecha y hora
    const parts = dateStr.split(' ');
    const datePart = parts[0]; // expected DD-MM-YYYY
    const dateSegments = datePart.split('-').map(s => Number(s));
    if (dateSegments.length === 3) {
      const [dd, mm, yyyy] = dateSegments;
      // Validar números
      if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) {
        // Hora opcional
        let hh = 0, min = 0, sec = 0;
        if (parts.length > 1) {
          const timeSegments = parts[1].split(':').map(s => Number(s));
          if (timeSegments.length >= 1 && !isNaN(timeSegments[0])) hh = timeSegments[0];
          if (timeSegments.length >= 2 && !isNaN(timeSegments[1])) min = timeSegments[1];
          if (timeSegments.length >= 3 && !isNaN(timeSegments[2])) sec = timeSegments[2];
        }
        return new Date(yyyy, mm - 1, dd, hh, min, sec);
      }
    }

    return null;
  }

  actualizarGrafico(): void {
    this.data = {
      ...this.data,
      datasets: [
        {
          ...this.data.datasets[0],
          data: [...this.entradasMesPublicadas]
        },
        {
          ...this.data.datasets[1],
          data: [...this.entradasMesNoPublicadas]
        }
      ]
    };
  }

  get sumEntradasPublicadas(): number {
    return Array.isArray(this.entradasMesPublicadas) ? this.entradasMesPublicadas.reduce((acc, v) => acc + (v || 0), 0) : 0;
  }

  get sumEntradasNoPublicadas(): number {
    return Array.isArray(this.entradasMesNoPublicadas) ? this.entradasMesNoPublicadas.reduce((acc, v) => acc + (v || 0), 0) : 0;
  }
}
