import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-recent-panel',
  templateUrl: './dashboard-recent-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DashboardRecentPanelComponent {
  @Input() recentItems: any[] = [];
  @Input() loadingRecent: boolean = false;
  @Input() errorRecent: string | null = null;
  @Input() recentSize: number = 10;
  @Input() recentTotalPages: number = 1;
  @Input() recentPage: number = 1;
  @Output() changeSize = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() downloadCsv = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  onDownloadClick(): void {
    this.downloadCsv.emit();
  }
}
