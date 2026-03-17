import { Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';
import { Rol } from '../../../../../core/models/rol.model';

@Component({
  selector: 'app-eliminar-rol',
  templateUrl: './eliminar-rol.component.html',
  standalone: false,
})
export class EliminarRolComponent {
  @Input() visible = false;
  @Input() rol: Rol | null = null;
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
