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
  canUsers = false;
  canRoles = false;
  canSystemSettings = false;
  canThemeManagement = false;
  canMaintenance = false;
  canComments = false;
  canTags = false;
  canCategories = false;
  canProfile = false;
  private readonly commentModerationPrivileges = [
    OpPrivilegioConstants.APROBAR_COMENTARIOS,
    OpPrivilegioConstants.OCULTAR_COMENTARIOS,
    OpPrivilegioConstants.BORRAR_COMENTARIOS_TODO,
    OpPrivilegioConstants.BORRAR_COMENTARIOS,
    OpPrivilegioConstants.MODERAR_COMENTARIOS,
  ];

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
    this.canUsers = this.hasPrivilege(OpPrivilegioConstants.GESTIONAR_USUARIOS);
    this.canRoles = this.hasAnyPrivilege([
      OpPrivilegioConstants.GESTIONAR_ROLES,
      OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS,
      OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS,
    ]);
    this.canSystemSettings = this.hasAnyPrivilege([
      OpPrivilegioConstants.GESTIONAR_AJUSTES_SISTEMA,
      OpPrivilegioConstants.CONFIGURAR_SISTEMA,
    ]);
    this.canThemeManagement = this.hasAnyPrivilege([
      OpPrivilegioConstants.GESTIONAR_TEMAS,
      OpPrivilegioConstants.CONFIGURAR_SISTEMA,
    ]);
    this.canMaintenance = this.hasAnyPrivilege([
      OpPrivilegioConstants.REALIZAR_MANTENIMIENTO,
      OpPrivilegioConstants.DEPURAR_ERRORES,
    ]);
    this.canComments = this.hasAnyPrivilege(this.commentModerationPrivileges);
    this.canTags = this.hasPrivilege(OpPrivilegioConstants.GESTIONAR_ETIQUETAS);
    this.canCategories = this.hasPrivilege(OpPrivilegioConstants.GESTIONAR_CATEGORIAS);
    this.canProfile = this.hasAnyPrivilege([
      OpPrivilegioConstants.GESTIONAR_PERFIL_PROPIO,
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
    return this.canUsers || this.canRoles || this.canProfile;
  }

  hasSystemSection(): boolean {
    return this.canSystemSettings || this.canThemeManagement || this.canMaintenance;
  }

  hasInteractionSection(): boolean {
    return this.canComments || this.canTags || this.canCategories;
  }

  private hasAdditionalAdminModules(): boolean {
    return (
      this.canEntries ||
      this.canPages ||
      this.canMedia ||
      this.canUsers ||
      this.canRoles ||
      this.canSystemSettings ||
      this.canThemeManagement ||
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
