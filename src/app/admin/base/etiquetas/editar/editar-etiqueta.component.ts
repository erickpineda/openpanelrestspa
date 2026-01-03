import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Etiqueta } from '../../../../core/models/etiqueta.model';

@Component({
  selector: 'app-editar-etiqueta',
  templateUrl: './editar-etiqueta.component.html',
  standalone: false
})
export class EditarEtiquetaComponent {
  @Input() visible = false;
  @Input() etiqueta: Etiqueta | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSuccess = new EventEmitter<void>();

  handleVisibleChange(event: boolean) {
    this.visible = event;
    this.visibleChange.emit(event);
  }

  cerrarModal() {
    this.handleVisibleChange(false);
  }

  onGuardar() {
    this.onSuccess.emit();
    this.cerrarModal();
  }
}
