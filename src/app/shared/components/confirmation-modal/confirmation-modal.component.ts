import { Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  standalone: false,
})
export class ConfirmationModalComponent {
  @Input() visible = false;
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Estás seguro de que quieres realizar esta acción?';
  @Input() itemName: string | undefined;
  @Input() warningText: string | undefined;
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Input() type: 'info' | 'warning' | 'danger' = 'info';
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) { }

  onVisibleChange(isVisible: boolean): void {
    this.visible = isVisible;
    this.visibleChange.emit(isVisible);
    if (!isVisible) {
      this.close.emit();
    }
    this.cdr.detectChanges();
  }

  onConfirm(): void {
    this.confirm.emit();
    this.onClose();
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  getHeaderColor(): string {
    const colors = {
      info: 'primary',
      warning: 'warning',
      danger: 'danger',
    };
    return colors[this.type];
  }
}
