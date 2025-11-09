// data-recovery-notification.component.ts
import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'app-data-recovery-notification',
  template: `
    <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <strong>📥 {{ title }}</strong>
      <p>{{ message }}</p>
      <div class="btn-group">
        <button type="button" class="btn btn-success btn-sm" (click)="onRecover.emit()">
          <i class="fas fa-download me-1"></i> {{ recoverText }}
        </button>
        <button type="button" class="btn btn-secondary btn-sm" (click)="onIgnore.emit()">
          <i class="fas fa-times me-1"></i> {{ ignoreText }}
        </button>
        <button type="button" class="btn btn-danger btn-sm" (click)="onDiscard.emit()">
          <i class="fas fa-trash me-1"></i> {{ discardText }}
        </button>
      </div>
    </div>
  `
})
export class DataRecoveryNotificationComponent {
  @Input() title = 'Datos recuperados';
  @Input() message = 'Se han encontrado datos no guardados de una sesión anterior.';
  @Input() recoverText = 'Recuperar';
  @Input() ignoreText = 'Ignorar';
  @Input() discardText = 'Descartar';
  
  @Output() onRecover = new EventEmitter<void>();
  @Output() onIgnore = new EventEmitter<void>();
  @Output() onDiscard = new EventEmitter<void>();
}