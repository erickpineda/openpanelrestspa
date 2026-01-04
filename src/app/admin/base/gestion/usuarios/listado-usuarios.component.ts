import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UsuarioService } from '../../../../core/services/data/usuario.service';
import { Usuario } from '../../../../core/models/usuario.model';
import { RolService } from '../../../../core/services/data/rol.service';
import { Rol } from '../../../../core/models/rol.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { SearchUtilService } from '../../../../core/services/utils/search-util.service';
import { OPConstants } from '../../../../shared/constants/op-global.constants';

@Component({
  selector: 'app-usuarios-list',
  templateUrl: './listado-usuarios.component.html',
  styleUrls: ['./listado-usuarios.component.scss'],
  standalone: false,
})
export class UsuariosListComponent implements OnInit, OnDestroy {
  readonly PROPIETARIO_ROLE_CODE = OPConstants.Roles.PROPIETARIO;

  loading = false;
  error: string | null = null;
  usuarios: Usuario[] = [];
  pageNo = 0;
  pageSize = 10;
  totalElements = 0;
  numberOfElements = 0;
  showAdvanced = false;
  basicSearchText = '';

  filtroUsuario = '';
  filtroRolCodigo: string | null = null;
  filtroEmailConfirmado: boolean | null = null;
  roles: Rol[] = [];

  editModalVisible = false;
  editUser: Usuario | null = null;
  originalUser: Usuario | null = null;

  showDeleteModal = false;
  userToDelete: Usuario | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private toast: ToastService,
    private log: LoggerService,
    private searchUtil: SearchUtilService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(pageNo = this.pageNo): void {
    this.loading = true;
    this.error = null;
    const hasFilters = !!(
      this.filtroUsuario ||
      this.filtroRolCodigo != null ||
      this.filtroEmailConfirmado != null
    );

    const handleResponse = (r: any) => {
      const data = r?.data || r;
      const list = Array.isArray(data?.elements) ? data.elements : Array.isArray(data) ? data : [];
      this.usuarios = list;
      this.totalElements = Number(data?.totalElements || list.length || 0);
      this.numberOfElements = list.length;
    };

    const handleError = (err: any) => {
      this.error = 'Error cargando usuarios';
      this.log.error('usuarios listar', err || 'Error desconocido');
    };

    if (!hasFilters) {
      this.usuarioService
        .listarPaginaSinGlobalLoader(pageNo, this.pageSize)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({ next: handleResponse, error: handleError });
    } else {
      const criteria: { filterKey: string; value: any; operation: string }[] = [];
      if (this.filtroUsuario)
        criteria.push({
          filterKey: 'username',
          value: this.filtroUsuario,
          operation: 'CONTAINS',
        });
      if (this.filtroRolCodigo != null)
        criteria.push({
          filterKey: 'rol.codigo',
          value: this.filtroRolCodigo,
          operation: 'EQUAL',
        });
      if (this.filtroEmailConfirmado != null)
        criteria.push({
          filterKey: 'emailConfirmado',
          value: String(this.filtroEmailConfirmado),
          operation: 'BOOLEAN',
        });

      const payload = this.searchUtil.buildRequest('Usuario', criteria, 'ALL');
      this.usuarioService
        .buscarSinGlobalLoader(payload, pageNo, this.pageSize)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({ next: handleResponse, error: handleError });
    }
  }

  loadRoles(): void {
    this.rolService
      .listarPagina(0, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r: any) => {
          const data = r?.data || r;
          let roles = Array.isArray(data?.elements)
            ? data.elements
            : Array.isArray(data?.content)
              ? data.content
              : Array.isArray(data)
                ? data
                : [];

          this.roles = roles;
        },
        error: () => {},
      });
  }

  search(): void {
    this.pageNo = 0;
    this.load();
  }

  reset(): void {
    this.filtroUsuario = '';
    this.filtroRolCodigo = null;
    this.filtroEmailConfirmado = null;
    this.pageNo = 0;
    this.load();
  }

  prev(): void {
    if (this.pageNo > 0) {
      this.pageNo--;
      this.load();
    }
  }

  next(): void {
    const maxPage = this.totalElements
      ? Math.ceil(this.totalElements / this.pageSize) - 1
      : this.pageNo + 1;
    if (this.pageNo < maxPage) {
      this.pageNo++;
      this.load();
    }
  }

  onPageChange(page: number): void {
    const totalPages = this.getTotalPages();
    const safePage = Math.max(0, Math.min(Number(page) || 0, Math.max(0, totalPages - 1)));
    if (safePage === this.pageNo) return;
    this.pageNo = safePage;
    this.load();
  }

  getTotalPages(): number {
    return this.totalElements ? Math.ceil(this.totalElements / this.pageSize) : 0;
  }

  onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text;
    this.filtroUsuario = text;
    this.search();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageNo = 0;
    this.load();
  }

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  openEdit(u: Usuario): void {
    this.originalUser = { ...u }; // Keep original for patch comparison
    this.editUser = { ...u };
    this.editModalVisible = true;
  }

  openCreate(): void {
    this.originalUser = null;
    this.editUser = new Usuario();
    // Ensure 0/undefined logic is handled. Usuario defaults to 0.
    this.editModalVisible = true;
  }

  saveEdit(usuario: Usuario): void {
    if (!usuario) return;
    this.editUser = usuario;
    this.loading = true;
    const hasId = !!this.editUser.idUsuario && this.editUser.idUsuario > 0;

    let op$;
    if (hasId) {
      // Use partial update with JSON Patch
      if (this.originalUser) {
        op$ = this.usuarioService.actualizarParcial(this.editUser.idUsuario!, this.editUser);
      } else {
        // Fallback if original is missing (shouldn't happen in edit mode)
        op$ = this.usuarioService.actualizar(this.editUser.idUsuario!, this.editUser);
      }
    } else {
      op$ = this.usuarioService.crear(this.editUser);
    }

    op$.subscribe({
      next: () => {
        this.toast.showSuccess(hasId ? 'Usuario actualizado' : 'Usuario creado', 'Usuarios');
        this.loading = false;
        this.editModalVisible = false;
        this.load();
      },
      error: (err: any) => {
        this.toast.showError(hasId ? 'Error actualizando' : 'Error creando', 'Usuarios');
        this.log.error(hasId ? 'usuarios actualizar' : 'usuarios crear', err);
        this.loading = false;
      },
    });
  }

  delete(u: Usuario): void {
    if (!u.idUsuario) return;
    // Protección para evitar borrar al propietario
    if (this.PROPIETARIO_ROLE_CODE && u.rolCodigo === this.PROPIETARIO_ROLE_CODE) {
      this.toast.showWarning('No se puede eliminar al usuario Propietario', 'Acción no permitida');
      return;
    }
    this.userToDelete = u;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.userToDelete?.idUsuario) {
      this.showDeleteModal = false;
      return;
    }
    this.loading = true;
    this.usuarioService
      .borrar(this.userToDelete.idUsuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Usuario eliminado', 'Usuarios');
          this.loading = false;
          this.showDeleteModal = false;
          this.userToDelete = null;
          this.load();
        },
        error: (err: any) => {
          this.toast.showError('Error eliminando usuario', 'Usuarios');
          this.log.error('usuarios borrar', err);
          this.loading = false;
          this.showDeleteModal = false;
          this.userToDelete = null;
        },
      });
  }

  trackByUsuario(index: number, u: Usuario): number | string {
    return u?.idUsuario ?? u?.username ?? index;
  }

  trackByRol(index: number, r: Rol): number | string {
    return r?.idRol ?? r?.codigo ?? index;
  }

  getRoleInfo(rolCodigo: string): { color: string; icon: string; label: string } {
    if (!rolCodigo) {
      return { color: 'secondary', icon: 'cilUser', label: 'Sin Rol' };
    }
    switch (rolCodigo) {
      case OPConstants.Roles.PROPIETARIO:
        return { color: 'danger', icon: 'cilShieldAlt', label: 'Propietario' };
      case OPConstants.Roles.ADMINISTRADOR:
        return { color: 'primary', icon: 'cilStar', label: 'Administrador' };
      case OPConstants.Roles.EDITOR:
        return { color: 'info', icon: 'cilPencil', label: 'Editor' };
      case OPConstants.Roles.AUTOR:
        return { color: 'success', icon: 'cilPen', label: 'Autor' };
      case OPConstants.Roles.LECTOR:
        // Usamos cilLibrary como fallback seguro para Lector
        return { color: 'secondary', icon: 'cilLibrary', label: 'Lector' };
      default:
        return { color: 'secondary', icon: 'cilUser', label: rolCodigo };
    }
  }

  getInitial(u: Usuario): string {
    return (u?.username || '?').charAt(0).toUpperCase();
  }
}
