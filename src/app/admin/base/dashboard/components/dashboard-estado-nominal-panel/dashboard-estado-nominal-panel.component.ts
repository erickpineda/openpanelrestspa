import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-estado-nominal-panel',
  templateUrl: './dashboard-estado-nominal-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardEstadoNominalPanelComponent {
  @Input() estadoNominalChartType: 'line' | 'bar' = 'line';
  @Input() estadoNominalStacked: boolean = false;
  @Input() seriesEntriesSplitEstadoNombreData: any;
  @Input() estadoNominalChartOptions: any;
  @Input() errorSplitEstadoNombre: string | null = null;

  @Output() setChartType = new EventEmitter<'line' | 'bar'>();
  @Output() toggleStacked = new EventEmitter<void>();
  @Output() downloadCsv = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
}

