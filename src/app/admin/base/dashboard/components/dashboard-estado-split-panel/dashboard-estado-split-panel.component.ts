import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-estado-split-panel',
  templateUrl: './dashboard-estado-split-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardEstadoSplitPanelComponent {
  @Input() loadingSplitEstado: boolean = false;
  @Input() seriesEntriesSplitData: any;
  @Input() errorSplitEstado: string | null = null;

  @Output() downloadCsv = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
}

