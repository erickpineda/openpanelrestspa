import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirmation-modal',
  template: `
    <c-modal [visible]="visible" (visibleChange)="onClose()">
      <c-modal-header>
        <h5 cModalTitle>{{ title }}</h5>
      </c-modal-header>
      <c-modal-body>
        {{ message }}
      </c-modal-body>
      <c-modal-footer>
        <button cButton color="secondary" (click)="onCancel()">Cancelar</button>
        <button cButton color="primary" (click)="onConfirm()">Confirmar</button>
      </c-modal-footer>
    </c-modal>
  `
})
export class ConfirmationModalComponent {
  @Input() visible = false;
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Estás seguro de que quieres realizar esta acción?';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
    this.onClose();
  }

  onCancel(): void {
    this.cancel.emit();
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }
}