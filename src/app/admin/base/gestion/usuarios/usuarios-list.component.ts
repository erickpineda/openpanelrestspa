import { Component, OnInit } from '@angular/core';
import { UsuariosService, UsuarioDTO } from '../../../../core/services/usuarios.service';
import { RolesService, RolDTO } from '../../../../core/services/roles.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';

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

  filtroUsuario = '';
  filtroRolId: number | null = null;
  filtroEmailConfirmado: boolean | null = null;
  roles: RolDTO[] = [];

  editModalVisible = false;
  editUser: UsuarioDTO | null = null;

  constructor(private usuariosService: UsuariosService, private rolesService: RolesService, private toast: ToastService, private log: LoggerService) {}

  ngOnInit(): void { this.loadRoles(); this.load(); }

  load(pageNo = this.pageNo): void {
    this.loading = true; this.error = null;
    const hasFilters = !!(this.filtroUsuario || this.filtroRolId != null || this.filtroEmailConfirmado != null);
    const handleResponse = (r: any) => {
      const data = r?.data || r;
      this.usuarios = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []);
      this.totalElements = Number(data?.totalElements || this.usuarios.length || 0);
      this.loading = false;
    };
    const handleError = (err: any) => { this.error = 'Error cargando usuarios'; this.loading = false; this.log.error('usuarios listar', err); };
    if (!hasFilters) {
      this.usuariosService.listar(pageNo, this.pageSize).subscribe({ next: handleResponse, error: handleError });
    } else {
      const payload = { dataOption: 'ALL', searchCriteriaList: [] as any[] };
      if (this.filtroUsuario) payload.searchCriteriaList.push({ filterKey: 'username', value: this.filtroUsuario, operation: 'CONTAINS', dataOption: 'ALL' });
      if (this.filtroRolId != null) payload.searchCriteriaList.push({ filterKey: 'idRol', value: String(this.filtroRolId), operation: 'EQUAL', dataOption: 'ALL' });
      if (this.filtroEmailConfirmado != null) payload.searchCriteriaList.push({ filterKey: 'emailConfirmado', value: String(this.filtroEmailConfirmado), operation: 'EQUAL', dataOption: 'ALL' });
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

  openEdit(u: UsuarioDTO): void { this.editUser = { ...u }; this.editModalVisible = true; }
  closeEdit(): void { this.editModalVisible = false; this.editUser = null; }
  saveEdit(): void {
    if (!this.editUser || !this.editUser.idUsuario) return;
    this.loading = true;
    this.usuariosService.actualizar(this.editUser.idUsuario, this.editUser).subscribe({
      next: () => { this.toast.showSuccess('Usuario actualizado', 'Usuarios'); this.loading = false; this.editModalVisible = false; this.load(); },
      error: (err: any) => { this.toast.showError('Error actualizando', 'Usuarios'); this.log.error('usuarios actualizar', err); this.loading = false; }
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
