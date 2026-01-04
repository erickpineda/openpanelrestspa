import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Privilegio } from '../../../../../core/models/privilegio.model';

@Component({
  selector: 'app-eliminar-privilegio',
  templateUrl: './eliminar-privilegio.component.html',
  standalone: false,
})
export class EliminarPrivilegioComponent {
  @Input() visible = false;
  @Input() privilegio: Privilegio | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onConfirm = new EventEmitter<void>();

  confirmar() {
    this.onConfirm.emit();
  }

  cerrarModal() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
