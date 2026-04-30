import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '../../core/services/auth/token-storage.service';
import { ToastService } from '../../core/services/ui/toast.service';
import { OpPrivilegioConstants } from '../../shared/constants/op-privilegio.constants';

@Component({
  selector: 'app-base-index',
  templateUrl: './base-index.component.html',
  standalone: false,
})
export class BaseIndexComponent implements OnInit {
  canEntries = false;
  canPages = false;
  canMedia = false;
  canUsersAndRoles = false;
  canSystemSettings = false;
  canMaintenance = false;
  canComments = false;
  canTags = false;
  canCategories = false;
  canProfile = false;

  constructor(
    private tokenStorage: TokenStorageService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.canEntries = this.hasAnyPrivilege([
      OpPrivilegioConstants.CREAR_ENTRADAS,
      OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
      OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
    ]);
    this.canPages = this.hasPrivilege(OpPrivilegioConstants.GESTIONAR_PAGINAS);
    this.canMedia = this.hasPrivilege(OpPrivilegioConstants.GESTIONAR_ARCHIVOS);
    this.canUsersAndRoles = this.hasAnyPrivilege([
      OpPrivilegioConstants.GESTIONAR_USUARIOS,
      OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS,
      OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS,
    ]);
    this.canSystemSettings = this.hasPrivilege(OpPrivilegioConstants.CONFIGURAR_SISTEMA);
    this.canMaintenance = this.hasAnyPrivilege([
      OpPrivilegioConstants.REALIZAR_MANTENIMIENTO,
      OpPrivilegioConstants.DEPURAR_ERRORES,
    ]);
    this.canComments = this.hasPrivilege(OpPrivilegioConstants.MODERAR_COMENTARIOS);
    this.canTags = this.hasPrivilege(OpPrivilegioConstants.GESTIONAR_ETIQUETAS);
    this.canCategories = this.hasPrivilege(OpPrivilegioConstants.GESTIONAR_CATEGORIAS);
    this.canProfile = this.hasAnyPrivilege([
      OpPrivilegioConstants.VER_CONTENIDO_PROPIO,
      OpPrivilegioConstants.GESTIONAR_PERFIL,
    ]);

    if (this.canProfile && !this.hasAdditionalAdminModules()) {
      this.toastService.showInfo(
        'Tu rol actual solo tiene acceso a Mi Perfil. Si necesitas más módulos, asigna más privilegios al rol.',
        'Acceso limitado'
      );
    }
  }

  hasContentSection(): boolean {
    return this.canEntries || this.canPages || this.canMedia;
  }

  hasUsersSection(): boolean {
    return this.canUsersAndRoles || this.canProfile;
  }

  hasSystemSection(): boolean {
    return this.canSystemSettings || this.canMaintenance;
  }

  hasInteractionSection(): boolean {
    return this.canComments || this.canTags || this.canCategories;
  }

  private hasAdditionalAdminModules(): boolean {
    return (
      this.canEntries ||
      this.canPages ||
      this.canMedia ||
      this.canUsersAndRoles ||
      this.canSystemSettings ||
      this.canMaintenance ||
      this.canComments ||
      this.canTags ||
      this.canCategories
    );
  }

  private hasPrivilege(privilege: string): boolean {
    const user = this.tokenStorage.getUser();
    const privileges: string[] = Array.isArray(user?.privileges) ? user.privileges : [];
    return privileges.includes(privilege);
  }

  private hasAnyPrivilege(privileges: string[]): boolean {
    return privileges.some((privilege) => this.hasPrivilege(privilege));
  }
}
