import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-series-panel',
  templateUrl: './dashboard-series-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DashboardSeriesPanelComponent {
  @Input() seriesDays: number = 30;
  @Input() seriesGranularity: 'hour' | 'day' | 'week' | 'month' = 'day';
  @Input() data: any = { labels: [], datasets: [] };
  @Input() loadingSeries: boolean = false;
  @Input() showMetricsTools: boolean = false;
  @Input() metricsExpanded: boolean = false;
  @Input() perf: Record<string, number> = {};
  @Input() perfUpdatedAt: Date | null = null;
  @Input() sumEntradasSerie: number = 0;
  @Input() sumComentarios: number = 0;
  @Input() sumUsuarios: number = 0;
  @Input() kpiUltimasEntradasColor: string = 'secondary';
  @Input() kpiComentariosColor: string = 'secondary';
  @Input() kpiNuevosUsuariosColor: string = 'secondary';

  @Output() changeDays = new EventEmitter<number>();
  @Output() changeGranularity = new EventEmitter<'hour' | 'day' | 'week' | 'month'>();
  @Output() downloadCsv = new EventEmitter<void>();
  @Output() toggleMetrics = new EventEmitter<void>();
  @Output() copyPerf = new EventEmitter<void>();
}
