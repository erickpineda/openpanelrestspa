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
import { TranslationService } from '../../../../core/services/translation.service';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_ERROR_HANDLING } from '../../../../core/interceptor/skip-global-error.token';

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

  currentSortField?: string;
  currentSortDirection?: 'ASC' | 'DESC';

  showAdvanced = false;
  basicSearchText = '';

  filtroUsuario = '';
  filtroRolCodigo: string | null = null;
  filtroEmailConfirmado: boolean | null = null;
  roles: Rol[] = [];

  showCreateModal = false;
  showEditModal = false;
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
    private cdr: ChangeDetectorRef,
    private translate: TranslationService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.load();

    this.translate.translations$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });
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

      if (this.currentSortField) {
        this.sortClientCache();
      }
    };

    const handleError = (err: any) => {
      this.error = this.translate.instant('ADMIN.USERS.ERROR_LOADING');
      this.log.error('usuarios listar', err || 'Error desconocido');
    };

    if (!hasFilters) {
      this.usuarioService
        .listarPaginaSinGlobalLoader(
          pageNo,
          this.pageSize,
          this.currentSortField,
          this.currentSortDirection
        )
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
        .buscarSinGlobalLoader(
          payload,
          pageNo,
          this.pageSize,
          this.currentSortField,
          this.currentSortDirection
        )
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

  ordenar(field: string, direction: 'ASC' | 'DESC') {
    this.currentSortField = field;
    this.currentSortDirection = direction;
    this.load();
  }

  getSortIcon(field: string): string {
    if (this.currentSortField !== field) return 'cilSortAlphaDown';
    return this.currentSortDirection === 'ASC' ? 'cilSortAlphaDown' : 'cilSortAlphaUp';
  }

  isSortActive(field: string, direction: 'ASC' | 'DESC'): boolean {
    return this.currentSortField === field && this.currentSortDirection === direction;
  }

  private sortClientCache() {
    if (!this.usuarios || this.usuarios.length === 0) return;
    if (!this.currentSortField || !this.currentSortDirection) return;

    const direction = this.currentSortDirection === 'ASC' ? 1 : -1;
    const field = this.currentSortField;

    this.usuarios.sort((a: any, b: any) => {
      let valA = a[field];
      let valB = b[field];

      // Handle nested properties if needed (e.g. rol.nombre)
      if (field.includes('.')) {
        const parts = field.split('.');
        valA = parts.reduce((obj: any, key: string) => obj?.[key], a);
        valB = parts.reduce((obj: any, key: string) => obj?.[key], b);
      }

      if (valA == null) return 1; // nulls last
      if (valB == null) return -1;

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
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

  onPageChange(page: number): void {
    this.pageNo = page;
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
    this.originalUser = { ...u };
    this.editUser = { ...u };
    this.showEditModal = true;
  }

  openCreate(): void {
    this.originalUser = null;
    this.editUser = new Usuario();
    this.showCreateModal = true;
  }

  // Removed saveEdit method as it is now handled by Crear/Editar components

  delete(u: Usuario): void {
    if (!u.idUsuario) return;
    if (this.PROPIETARIO_ROLE_CODE && u.rolCodigo === this.PROPIETARIO_ROLE_CODE) {
      this.toast.showWarning(
        this.translate.instant('ADMIN.USERS.OWNER_DELETE_ERROR'),
        this.translate.instant('ADMIN.USERS.ACTION_NOT_ALLOWED')
      );
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
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    this.usuarioService
      .borrar(this.userToDelete.idUsuario, context)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.showSuccess(
            this.translate.instant('ADMIN.USERS.SUCCESS.DELETE'),
            this.translate.instant('MENU.USERS')
          );
          this.loading = false;
          this.showDeleteModal = false;
          this.userToDelete = null;
          this.load();
        },
        error: (err: any) => {
          this.toast.showError(
            this.translate.instant('ADMIN.USERS.ERROR.DELETE'),
            this.translate.instant('MENU.USERS')
          );
          this.log.error('usuarios borrar', err);
          this.loading = false;
          this.showDeleteModal = false;
          this.userToDelete = null;
          this.cdr.detectChanges();
        },
      });
  }

  getRoleInfo(rolCodigo: string): { color: string; icon: string; label: string } {
    if (!rolCodigo) {
      return { color: 'secondary', icon: 'cilUser', label: 'ADMIN.USERS.ROLES.SIN_ROL' };
    }
    switch (rolCodigo) {
      case OPConstants.Roles.PROPIETARIO:
        return { color: 'danger', icon: 'cilShieldAlt', label: 'ADMIN.USERS.ROLES.PROPIETARIO' };
      case OPConstants.Roles.ADMINISTRADOR:
        return { color: 'primary', icon: 'cilStar', label: 'ADMIN.USERS.ROLES.ADMINISTRADOR' };
      case OPConstants.Roles.EDITOR:
        return { color: 'info', icon: 'cilPencil', label: 'ADMIN.USERS.ROLES.EDITOR' };
      case OPConstants.Roles.AUTOR:
        return { color: 'success', icon: 'cilPen', label: 'ADMIN.USERS.ROLES.AUTOR' };
      case OPConstants.Roles.LECTOR:
        return { color: 'secondary', icon: 'cilLibrary', label: 'ADMIN.USERS.ROLES.LECTOR' };
      default:
        return { color: 'secondary', icon: 'cilUser', label: rolCodigo };
    }
  }

  getInitial(u: Usuario): string {
    return (u?.username || '?').charAt(0).toUpperCase();
  }
}
