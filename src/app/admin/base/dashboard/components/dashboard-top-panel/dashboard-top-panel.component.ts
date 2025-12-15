import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-top-panel',
  templateUrl: './dashboard-top-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardTopPanelComponent {
  @Input() title: string = '';
  @Input() items: Array<{ name?: string; count?: number }> = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() badgeColor: string = 'secondary';
  @Input() csvDataTestId: string = '';
  @Input() showPeriodControls: boolean = false;
  @Input() topLimit?: number;
  @Input() topPeriodDays?: number;
  @Input() retryBtnClass?: string;

  @Output() changeTopLimit = new EventEmitter<number>();
  @Output() changePeriod = new EventEmitter<number>();
  @Output() downloadCsv = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
}

