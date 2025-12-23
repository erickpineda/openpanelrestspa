import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-dashboard-content-panel',
  templateUrl: './dashboard-content-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DashboardContentPanelComponent {
  @Input() loadingContentStats: boolean = false;
  @Input() errorContentStats: string | null = null;
  @Input() contentStats: any;
  @Input() contentStatsChartData: any;
  @Input() contentEstadoRows: Array<{
    estado: string;
    total: number;
    porcentaje: number;
  }> = [];
  @Input() kpiUsuariosTotalColor: string = 'secondary';
  @Input() kpiEntradasTotalColor: string = 'secondary';
  @Input() kpiComentariosTotalColor: string = 'secondary';
  @Input() kpiFicherosTotalColor: string = 'secondary';

  @Output() downloadContentCsv = new EventEmitter<void>();
  @Output() downloadEstadosCsv = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
}
