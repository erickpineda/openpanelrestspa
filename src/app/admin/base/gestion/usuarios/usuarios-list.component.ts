import { Component, OnInit } from '@angular/core';
import { UsuariosService, UsuarioDTO } from '../../../../core/services/usuarios.service';
import { RolesService, RolDTO } from '../../../../core/services/roles.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { SearchUtilService } from '../../../../core/services/utils/search-util.service';

@Component({
  selector: 'app-usuarios-list',
  templateUrl: './usuarios-list.component.html',
  styleUrls: ['./usuarios-list.component.scss']
})
export class UsuariosListComponent implements OnInit {
  loading = false;
  error: string | null = null;
  usuarios: UsuarioDTO[] = [];
  pageNo = 0;
  pageSize = 10;
  totalElements = 0;
  showAdvanced = false;
  basicSearchText = '';

  filtroUsuario = '';
  filtroRolId: number | null = null;
  filtroEmailConfirmado: boolean | null = null;
  roles: RolDTO[] = [];

  editModalVisible = false;
  editUser: UsuarioDTO | null = null;

  constructor(private usuariosService: UsuariosService, private rolesService: RolesService, private toast: ToastService, private log: LoggerService, private searchUtil: SearchUtilService) {}

  ngOnInit(): void { this.loadRoles(); this.load(); }

  load(pageNo = this.pageNo): void {
    this.loading = true; this.error = null;
    const hasFilters = !!(this.filtroUsuario || this.filtroRolId != null || this.filtroEmailConfirmado != null);
    const handleResponse = (r: any) => {
      const data = r?.data || r;
      const list = Array.isArray(data?.elements) ? data.elements : (Array.isArray(data) ? data : []);
      this.usuarios = list;
      this.totalElements = Number(data?.totalElements || list.length || 0);
      this.loading = false;
    };
    const handleError = (err: any) => { this.error = 'Error cargando usuarios'; this.loading = false; this.log.error('usuarios listar', err); };
    if (!hasFilters) {
      this.usuariosService.listar(pageNo, this.pageSize).subscribe({ next: handleResponse, error: handleError });
    } else {
      const criteria: { filterKey: string; value: any; operation: string }[] = [];
      if (this.filtroUsuario) criteria.push({ filterKey: 'username', value: this.filtroUsuario, operation: 'CONTAINS' });
      if (this.filtroRolId != null) criteria.push({ filterKey: 'idRol', value: String(this.filtroRolId), operation: 'EQUAL' });
      if (this.filtroEmailConfirmado != null) criteria.push({ filterKey: 'emailConfirmado', value: String(this.filtroEmailConfirmado), operation: 'EQUAL' });
      const payload = this.searchUtil.buildRequest('Usuario', criteria, 'ALL');
      this.usuariosService.buscar(payload, pageNo, this.pageSize).subscribe({ next: handleResponse, error: handleError });
    }
  }

  loadRoles(): void {
    this.rolesService.listar(0, 50).subscribe({
      next: (r: any) => {
        const data = r?.data || r;
        this.roles = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []);
      },
      error: () => {}
    });
  }

  search(): void { this.pageNo = 0; this.load(); }
  reset(): void { this.filtroUsuario = ''; this.filtroRolId = null; this.filtroEmailConfirmado = null; this.pageNo = 0; this.load(); }
  prev(): void { if (this.pageNo > 0) { this.pageNo--; this.load(); } }
  next(): void { const maxPage = this.totalElements ? Math.ceil(this.totalElements / this.pageSize) - 1 : this.pageNo + 1; if (this.pageNo < maxPage) { this.pageNo++; this.load(); } }

  getTotalPages(): number { return this.totalElements ? Math.ceil(this.totalElements / this.pageSize) : 0; }

  onBasicSearchTextChange(text: string): void { this.basicSearchText = text; this.filtroUsuario = text; this.search(); }
  onPageSizeChange(size: number): void { this.pageSize = size; this.pageNo = 0; this.load(); }
  toggleAdvanced(): void { this.showAdvanced = !this.showAdvanced; }

  openEdit(u: UsuarioDTO): void { this.editUser = { ...u }; this.editModalVisible = true; }
  openCreate(): void { this.editUser = { idUsuario: undefined, username: '', nombre: '', apellido: '', email: '', idRol: undefined } as UsuarioDTO; this.editModalVisible = true; }
  closeEdit(): void { this.editModalVisible = false; this.editUser = null; }
  isEmailValid(e?: string): boolean { if (!e) return false; const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return re.test(e); }
  isUserFormValid(): boolean { return !!(this.editUser && this.editUser.username && this.isEmailValid(this.editUser.email) && this.editUser.idRol != null); }
  getUserErrors(): string[] {
    const errs: string[] = [];
    if (!this.editUser) return errs;
    if (!this.editUser.username) errs.push('Usuario requerido');
    if (!this.isEmailValid(this.editUser.email)) errs.push('Email inválido');
    if (this.editUser.idRol == null) errs.push('Rol requerido');
    return errs;
  }
  getRolNombre(id?: number): string {
    if (id == null) return '';
    const r = this.roles.find(x => x.id === id);
    return r && r.nombre ? r.nombre : String(id);
  }
  saveEdit(): void {
    if (!this.editUser) return;
    this.loading = true;
    const hasId = !!this.editUser.idUsuario;
    const op$ = hasId ? this.usuariosService.actualizar(this.editUser.idUsuario!, this.editUser) : this.usuariosService.crear(this.editUser);
    op$.subscribe({
      next: () => {
        this.toast.showSuccess(hasId ? 'Usuario actualizado' : 'Usuario creado', 'Usuarios');
        this.loading = false; this.editModalVisible = false; this.load();
      },
      error: (err: any) => {
        this.toast.showError(hasId ? 'Error actualizando' : 'Error creando', 'Usuarios');
        this.log.error(hasId ? 'usuarios actualizar' : 'usuarios crear', err);
        this.loading = false;
      }
    });
  }

  delete(u: UsuarioDTO): void {
    if (!u.idUsuario) return;
    if (!confirm('¿Eliminar usuario?')) return;
    this.loading = true;
    this.usuariosService.borrar(u.idUsuario).subscribe({
      next: () => { this.toast.showSuccess('Usuario eliminado', 'Usuarios'); this.loading = false; this.load(); },
      error: (err: any) => { this.toast.showError('Error eliminando', 'Usuarios'); this.log.error('usuarios borrar', err); this.loading = false; }
    });
  }
}
