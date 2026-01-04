import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Rol } from '../../../../../core/models/rol.model';
import { Privilegio } from '../../../../../core/models/privilegio.model';
import { OPConstants } from '../../../../../shared/constants/op-global.constants';

@Component({
  selector: 'app-rol-form',
  templateUrl: './rol-form.component.html',
  standalone: false,
})
export class RolFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() rol: Rol | null = null;
  @Input() isEditing = false;
  @Input() privilegios: Privilegio[] = [];
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<Rol>();

  readonly PROPIETARIO_ROLE_CODE = OPConstants.Roles.PROPIETARIO_CODE;
  readonly ADMIN_ROLE_CODE = OPConstants.Roles.ADMIN_CODE;

  manualCodeEntry = false;
  
  // Clone for editing
  editRol: Rol | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rol'] && this.rol) {
      this.editRol = JSON.parse(JSON.stringify(this.rol));
      if (!this.editRol!.privilegios) {
        this.editRol!.privilegios = [];
      }
      // RESTRICCION: Propietario siempre debe tener todos los privilegios
      if (this.editRol!.codigo === this.PROPIETARIO_ROLE_CODE) {
        this.editRol!.privilegios = JSON.parse(JSON.stringify(this.privilegios));
      }
      this.manualCodeEntry = false;
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  save(): void {
    if (this.editRol && this.isRolFormValid()) {
      this.onSave.emit(this.editRol);
    }
  }

  isProtectedRole(rol: Rol | null): boolean {
    if (!rol || !rol.codigo) return false;
    return rol.codigo === this.PROPIETARIO_ROLE_CODE || rol.codigo === this.ADMIN_ROLE_CODE;
  }

  isRolFormValid(): boolean {
    return !!(
      this.editRol &&
      this.editRol.nombre &&
      this.editRol.nombre.trim().length > 0 &&
      this.editRol.codigo &&
      this.editRol.codigo.trim().length > 0
    );
  }

  onNombreInput(value: string): void {
    if (!this.editRol) return;
    this.editRol.nombre = value;

    // Autogenerar código si no estamos editando y el usuario no ha introducido manualmente un código
    if (!this.isEditing && !this.manualCodeEntry) {
      this.generateCodeFromNombre(value);
    }
  }

  onCodigoInput(value: string): void {
    if (!this.editRol) return;
    this.editRol.codigo = value.toUpperCase();
    this.manualCodeEntry = true;
  }

  private generateCodeFromNombre(nombre: string): void {
    if (!this.editRol) return;
    // Tomar primeros 5 caracteres, quitar espacios, mayúsculas
    let code = nombre.replace(/\s/g, '').substring(0, 5).toUpperCase();
    this.editRol.codigo = code;
  }

  togglePrivilegio(privilegio: Privilegio, checked: boolean): void {
    if (!this.editRol) return;

    // RESTRICCION: Propietario no se le pueden quitar privilegios
    if (this.editRol.codigo === this.PROPIETARIO_ROLE_CODE && !checked) {
      return;
    }

    if (checked) {
      // Agregar si no existe
      if (!this.editRol.privilegios.some((p: Privilegio) => p.codigo === privilegio.codigo)) {
        this.editRol.privilegios.push(privilegio);
      }
    } else {
      // Remover
      this.editRol.privilegios = this.editRol.privilegios.filter(
        (p: Privilegio) => p.codigo !== privilegio.codigo
      );
    }
  }

  hasPrivilegio(privilegio: Privilegio): boolean {
    if (!this.editRol || !this.editRol.privilegios) return false;
    return this.editRol.privilegios.some((p: Privilegio) => p.idPrivilegio === privilegio.idPrivilegio);
  }

  areAllPrivilegiosSelected(): boolean {
    if (!this.editRol || !this.editRol.privilegios || this.privilegios.length === 0) return false;
    const rolPrivilegiosIds = this.editRol.privilegios.map((p: Privilegio) => p.idPrivilegio);
    return this.privilegios.every((p) => rolPrivilegiosIds.includes(p.idPrivilegio));
  }

  areSomePrivilegiosSelected(): boolean {
    if (!this.editRol || !this.editRol.privilegios || this.privilegios.length === 0) return false;
    const count = this.editRol.privilegios.length;
    return count > 0 && count < this.privilegios.length;
  }

  toggleAllPrivilegios(checked: boolean): void {
    if (!this.editRol) return;

    // RESTRICCION: Propietario no se puede deseleccionar todos
    if (this.editRol.codigo === this.PROPIETARIO_ROLE_CODE && !checked) {
      return;
    }

    if (checked) {
      this.editRol.privilegios = JSON.parse(JSON.stringify(this.privilegios));
    } else {
      this.editRol.privilegios = [];
    }
  }

  trackByPrivilegio(index: number, p: Privilegio): number | string {
    return p?.idPrivilegio ?? p?.codigo ?? index;
  }
}
