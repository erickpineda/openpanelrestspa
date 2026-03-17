import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-settings-modal',
  templateUrl: './dashboard-settings-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DashboardSettingsModalComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() settings: any;
  @Input() clearFeedback: string | null = null;
  @Output() apply = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  onClose() {
    this.visibleChange.emit(false);
    this.close.emit();
  }
  onApply() {
    this.apply.emit();
  }
  onReset() {
    this.reset.emit();
  }
}
