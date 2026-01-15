import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Usuario } from '../../../../../core/models/usuario.model';
import { Rol } from '../../../../../core/models/rol.model';
import { OPConstants } from '../../../../../shared/constants/op-global.constants';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  standalone: false
})
export class UsuarioFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() usuario: Usuario | null = null;
  @Input() roles: Rol[] = [];
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<Usuario>();

  readonly PROPIETARIO_ROLE_CODE = OPConstants.Roles.PROPIETARIO;
  
  disabled = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      if (this.usuario && this.usuario.idUsuario) {
        this.disabled = true;
      } else {
        this.disabled = false;
      }
    }
  }

  handleVisibleChange(event: boolean) {
    this.visible = event;
    this.visibleChange.emit(event);
  }

  cerrarModal() {
    this.handleVisibleChange(false);
  }

  guardar() {
    if (this.usuario && this.isUserFormValid()) {
      this.onSave.emit(this.usuario);
    }
  }
  
  enableEdit() {
    this.disabled = false;
  }

  isEmailValid(e?: string): boolean {
    if (!e) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(e);
  }

  isUserFormValid(): boolean {
    return !!(
      this.usuario &&
      this.usuario.username &&
      this.isEmailValid(this.usuario.email) &&
      this.usuario.rolCodigo
    );
  }
}
