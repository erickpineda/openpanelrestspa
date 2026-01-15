import { Component, EventEmitter, Input, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { Etiqueta } from '../../../../core/models/etiqueta.model';
import { EtiquetaFormComponent } from '../etiqueta-form/etiqueta-form.component';

@Component({
  selector: 'app-editar-etiqueta',
  templateUrl: './editar-etiqueta.component.html',
  standalone: false
})
export class EditarEtiquetaComponent implements OnChanges {
  @Input() visible = false;
  @Input() etiqueta: Etiqueta | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSuccess = new EventEmitter<void>();

  @ViewChild(EtiquetaFormComponent) formComponent!: EtiquetaFormComponent;

  disabled = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.disabled = true;
    }
  }

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

  onEditar() {
    this.disabled = false;
  }

  onGuardarClick() {
    this.formComponent.onSubmit();
  }
}
