import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Usuario } from '@core/models/usuario.model';

@Component({
  selector: 'app-eliminar-usuario',
  templateUrl: './eliminar-usuario.component.html',
  standalone: false,
})
export class EliminarUsuarioComponent {
  @Input() visible = false;
  @Input() usuario: Usuario | null = null;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onConfirm = new EventEmitter<void>();

  handleVisibleChange(event: boolean) {
    this.visible = event;
    this.visibleChange.emit(event);
  }

  cerrarModal() {
    this.handleVisibleChange(false);
  }

  confirmar() {
    this.onConfirm.emit();
  }
}
