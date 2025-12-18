import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
    selector: 'app-data-recovery-notification',
    templateUrl: './data-recovery-notification.component.html',
    styleUrls: ['./data-recovery-notification.component.scss'],
    standalone: false
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