import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-storage-panel',
  templateUrl: './dashboard-storage-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DashboardStoragePanelComponent {
  @Input() loadingStorage: boolean = false;
  @Input() storage: any;
  @Input() formatBytesFn?: (n?: number) => string;
  @Output() downloadCsv = new EventEmitter<void>();

  onDownloadClick(): void {
    this.downloadCsv.emit();
  }
}
