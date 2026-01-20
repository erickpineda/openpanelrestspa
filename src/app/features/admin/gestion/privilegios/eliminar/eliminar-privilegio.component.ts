import { Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';
import { Privilegio } from '../../../../../core/models/privilegio.model';

@Component({
  selector: 'app-eliminar-privilegio',
  templateUrl: './eliminar-privilegio.component.html',
  standalone: false,
})
export class EliminarPrivilegioComponent {
  @Input() visible = false;
  @Input() privilegio: Privilegio | null = null;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<void>();
  constructor(private cdr: ChangeDetectorRef) {}
  cerrarModal() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cdr.detectChanges();
  }
  confirmar() {
    this.confirm.emit();
  }
}
