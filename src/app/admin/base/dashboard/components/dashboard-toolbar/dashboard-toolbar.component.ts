import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-dashboard-toolbar',
  templateUrl: './dashboard-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DashboardToolbarComponent {
  @Input() forceFromDb: boolean = false;
  @Input() exportingZip: boolean = false;
  @Input() exportError: string | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() toggleForce = new EventEmitter<void>();
  @Output() downloadData = new EventEmitter<void>();
  @Output() downloadZip = new EventEmitter<void>();
}
