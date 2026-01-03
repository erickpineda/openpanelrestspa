import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-crear-etiqueta',
  templateUrl: './crear-etiqueta.component.html',
  standalone: false
})
export class CrearEtiquetaComponent {
  @Input() visible = false;
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
