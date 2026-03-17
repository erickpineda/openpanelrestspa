import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Etiqueta } from '../../../../core/models/etiqueta.model';

@Component({
  selector: 'app-eliminar-etiqueta',
  templateUrl: './eliminar-etiqueta.component.html',
  standalone: false,
})
export class EliminarEtiquetaComponent {
  @Input() visible = false;
  @Input() etiqueta: Etiqueta | null = null;
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
