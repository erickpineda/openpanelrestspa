import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Rol } from '../../../../../core/models/rol.model';

@Component({
  selector: 'app-eliminar-rol',
  templateUrl: './eliminar-rol.component.html',
  standalone: false,
})
export class EliminarRolComponent {
  @Input() visible = false;
  @Input() rol: Rol | null = null;
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
