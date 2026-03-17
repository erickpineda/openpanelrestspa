import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { EtiquetaFormComponent } from '../etiqueta-form/etiqueta-form.component';

@Component({
  selector: 'app-crear-etiqueta',
  templateUrl: './crear-etiqueta.component.html',
  standalone: false,
})
export class CrearEtiquetaComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSuccess = new EventEmitter<void>();

  @ViewChild(EtiquetaFormComponent) formComponent?: EtiquetaFormComponent;

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

  triggerSave() {
    if (this.formComponent) {
      this.formComponent.onSubmit();
    }
  }
}
