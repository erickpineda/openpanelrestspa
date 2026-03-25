import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dev-feature-modal',
  templateUrl: './dev-feature-modal.component.html',
  styleUrls: ['./dev-feature-modal.component.scss'],
  standalone: false,
})
export class DevFeatureModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() titleKey = 'PUBLIC.DEV_MODAL.TITLE';
  @Input() bodyKey = 'PUBLIC.DEV_MODAL.BODY_GENERIC';
  @Input() okKey = 'PUBLIC.DEV_MODAL.OK';

  close(): void {
    this.visibleChange.emit(false);
  }
}

