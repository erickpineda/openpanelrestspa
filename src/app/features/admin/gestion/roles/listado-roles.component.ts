import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { finalize, takeUntil, switchMap } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { RolService } from '../../../../core/services/data/rol.service';
import { Rol } from '../../../../core/models/rol.model';
import { PrivilegioService } from '../../../../core/services/data/privilegio.service';
import { Privilegio } from '../../../../core/models/privilegio.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { SearchUtilService } from '../../../../core/services/utils/search-util.service';
import { OPConstants } from '../../../../shared/constants/op-global.constants';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_ERROR_HANDLING } from '../../../../core/interceptor/skip-global-error.token';

@Component({
  selector: 'app-roles-list',
  templateUrl: './listado-roles.component.html',
  styleUrls: ['./listado-roles.component.scss'],
  standalone: false,
})
export class RolesListComponent implements OnInit, OnDestroy {
  readonly PROPIETARIO_ROLE_CODE = OPConstants.Roles.PROPIETARIO_CODE;
  readonly ADMIN_ROLE_CODE = OPConstants.Roles.ADMIN_CODE;

  loading = false;
  error: string | null = null;
  roles: Rol[] = [];
  privilegios: Privilegio[] = [];

  pageNo = 0;
  pageSize = 10;
  totalElements = 0;
  numberOfElements = 0;

  showAdvanced = false;
  basicSearchText = '';
  filtroNombre = '';

  editModalVisible = false;
  editRol: Rol | null = null;
  isEditing = false;
  manualCodeEntry = false;

  showDeleteModal = false;
  rolToDelete: Rol | null = null;

  // Sorting
  currentSortField?: string | null;
  currentSortDirection?: string | null;

  private destroy$ = new Subject<void>();

  constructor(
    private rolService: RolService,
    private privilegioService: PrivilegioService,
    private toast: ToastService,
    private log: LoggerService,
    private searchUtil: SearchUtilService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPrivilegios();
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(pageNo = this.pageNo): void {
    this.loading = true;
    this.error = null;

    const hasFilters = !!this.filtroNombre;

    const handleResponse = (r: any) => {
      const data = r?.data || r;
      const list = Array.isArray(data?.elements) ? data.elements : Array.isArray(data) ? data : [];
      this.roles = list.map((item: any) => {
        if (!item.privilegios && item.permisos) {
          item.privilegios = item.permisos;
        }
        return item;
      });
      this.loadPrivilegiosForRoles(this.roles);
      this.totalElements = Number(data?.totalElements || list.length || 0);
      this.numberOfElements = list.length;
    };

    const handleError = (err: any) => {
      this.error = 'Error cargando roles';
      this.log.error('roles listar', err);
    };

    if (!hasFilters) {
      this.rolService
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
      if (this.filtroNombre)
        criteria.push({
          filterKey: 'nombre',
          value: this.filtroNombre,
          operation: 'CONTAINS',
        });

      const payload = this.searchUtil.buildRequest('Rol', criteria, 'ALL');
      this.rolService
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

  loadPrivilegiosForRoles(roles: Rol[]): void {
    const codigos = roles.map((r) => r.codigo).filter((c) => !!c);
    if (codigos.length === 0) return;
    roles.forEach((r) => (r.privilegios = []));
    this.fetchPrivilegiosRecursively(codigos, 0, roles);
  }

  private fetchPrivilegiosRecursively(codigos: string[], pageNo: number, roles: Rol[]): void {
    const PAGE_SIZE = 50;
    this.rolService
      .obtenerPrivilegiosPorCodigos(codigos, pageNo, PAGE_SIZE)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const data = response?.data || response;
          const elements = Array.isArray(data?.elements)
            ? data.elements
            : Array.isArray(data)
              ? data
              : [];
          elements.forEach((item: any) => {
            const rol = roles.find(
              (r) => (r.nombre || '').toUpperCase() === (item.rolNombre || '').toUpperCase()
            );
            if (rol) {
              const priv = new Privilegio();
              priv.idPrivilegio = item.idPrivilegio;
              priv.nombre = item.privilegioNombre;
              priv.codigo = item.privilegioCodigo;
              priv.descripcion = item.privilegioDescripcion;
              rol.privilegios.push(priv);
            }
          });
          const totalPages = data?.totalPages || 0;
          if (pageNo < totalPages - 1) {
            this.fetchPrivilegiosRecursively(codigos, pageNo + 1, roles);
          }
        },
        error: (err) => {
          this.log.error(`Error cargando privilegios para roles (página ${pageNo})`, err);
        },
      });
  }

  loadPrivilegios(): void {
    this.privilegioService
      .listarSafe(0, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (privilegios) => {
          this.privilegios = privilegios || [];
        },
        error: (err) => {
          this.log.error('Error cargando privilegios', err);
        },
      });
  }

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text;
    this.filtroNombre = text;
    if (!this.showAdvanced) {
      this.pageNo = 0;
      this.load();
    }
  }

  search(): void {
    this.pageNo = 0;
    this.load();
  }

  reset(): void {
    this.filtroNombre = '';
    this.basicSearchText = '';
    this.currentSortField = null;
    this.currentSortDirection = null;
    this.pageNo = 0;
    this.load();
  }

  ordenar(field: string, direction: string) {
    if (this.currentSortField === field && this.currentSortDirection === direction) {
      this.currentSortField = null;
      this.currentSortDirection = null;
    } else {
      this.currentSortField = field;
      this.currentSortDirection = direction;
    }
    this.pageNo = 0;
    this.load();
  }

  getSortIcon(field: string): string {
    if (this.currentSortField !== field) {
      return 'cilSortAlphaDown'; // Default icon
    }
    return this.currentSortDirection === 'ASC' ? 'cilSortAlphaDown' : 'cilSortAlphaUp';
  }

  isSortActive(field: string, direction: string): boolean {
    return this.currentSortField === field && this.currentSortDirection === direction;
  }

  private sortClientCache() {
    if (!this.roles || this.roles.length === 0) return;
    if (!this.currentSortField || !this.currentSortDirection) return;

    const direction = this.currentSortDirection === 'ASC' ? 1 : -1;
    const field = this.currentSortField;

    this.roles.sort((a: any, b: any) => {
      let valA = a[field];
      let valB = b[field];

      if (field.includes('.')) {
        const parts = field.split('.');
        valA = parts.reduce((obj: any, key: string) => obj?.[key], a);
        valB = parts.reduce((obj: any, key: string) => obj?.[key], b);
      }

      if (valA == null) return 1;
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

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageNo = 0;
    this.load();
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

  isProtectedRole(rol: Rol | null): boolean {
    if (!rol || !rol.codigo) return false;
    return rol.codigo === this.PROPIETARIO_ROLE_CODE || rol.codigo === this.ADMIN_ROLE_CODE;
  }

  openCreate(): void {
    this.editRol = new Rol();
    this.isEditing = false;
    this.manualCodeEntry = false;
    this.editModalVisible = true;
  }

  openEdit(rol: Rol): void {
    this.editRol = JSON.parse(JSON.stringify(rol));
    if (!this.editRol!.privilegios) {
      this.editRol!.privilegios = [];
    }
    if (this.editRol!.codigo === this.PROPIETARIO_ROLE_CODE) {
      this.editRol!.privilegios = JSON.parse(JSON.stringify(this.privilegios));
    }
    this.isEditing = true;
    this.editModalVisible = true;
  }

  closeEdit(): void {
    this.editModalVisible = false;
    this.editRol = null;
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
    let code = nombre.replace(/\s/g, '').substring(0, 5).toUpperCase();
    this.editRol.codigo = code;
  }

  togglePrivilegio(privilegio: Privilegio, checked: boolean): void {
    if (!this.editRol) return;
    if (this.editRol.codigo === this.PROPIETARIO_ROLE_CODE && !checked) {
      return;
    }
    if (checked) {
      if (!this.editRol.privilegios.some((p) => p.codigo === privilegio.codigo)) {
        this.editRol.privilegios.push(privilegio);
      }
    } else {
      this.editRol.privilegios = this.editRol.privilegios.filter(
        (p) => p.codigo !== privilegio.codigo
      );
    }
  }

  hasPrivilegio(privilegio: Privilegio): boolean {
    if (!this.editRol || !this.editRol.privilegios) return false;
    return this.editRol.privilegios.some((p) => p.idPrivilegio === privilegio.idPrivilegio);
  }

  areAllPrivilegiosSelected(): boolean {
    if (!this.editRol || !this.editRol.privilegios || this.privilegios.length === 0) return false;
    const rolPrivilegiosIds = this.editRol.privilegios.map((p) => p.idPrivilegio);
    return this.privilegios.every((p) => rolPrivilegiosIds.includes(p.idPrivilegio));
  }

  areSomePrivilegiosSelected(): boolean {
    if (!this.editRol || !this.editRol.privilegios || this.privilegios.length === 0) return false;
    const count = this.editRol.privilegios.length;
    return count > 0 && count < this.privilegios.length;
  }

  toggleAllPrivilegios(checked: boolean): void {
    if (!this.editRol) return;
    if (this.editRol.codigo === this.PROPIETARIO_ROLE_CODE && !checked) {
      return;
    }
    if (checked) {
      this.editRol.privilegios = JSON.parse(JSON.stringify(this.privilegios));
    } else {
      this.editRol.privilegios = [];
    }
  }

  saveEdit(rol: Rol): void {
    if (!rol) return;
    this.loading = true;
    this.editRol = rol;
    if (rol.codigo === this.PROPIETARIO_ROLE_CODE) {
      rol.privilegios = JSON.parse(JSON.stringify(this.privilegios));
    }
    if (rol.codigo === this.ADMIN_ROLE_CODE) {
      if (!rol.privilegios || rol.privilegios.length === 0) {
        this.toast.showWarning(
          'El rol de Administrador no puede quedar sin privilegios.',
          'Validación'
        );
        this.loading = false;
        return;
      }
    }
    const privilegios = [...rol.privilegios];
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    const op$ = this.isEditing
      ? this.rolService.actualizar(rol.codigo, rol, context)
      : this.rolService.crear(rol, context);
    op$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((res: any) => {
          const rolCode = this.isEditing
            ? rol.codigo
            : res?.codigo || res?.data?.codigo || rol.codigo;
          if (privilegios) {
            const codigos = privilegios.map((p) => p.codigo);
            return this.rolService.actualizarPrivilegios(rolCode, codigos);
          }
          return of(res);
        })
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess(this.isEditing ? 'Rol actualizado' : 'Rol creado', 'Roles');
          this.loading = false;
          this.editModalVisible = false;
          this.load();
        },
        error: (err: any) => {
          this.toast.showError(this.isEditing ? 'Error actualizando' : 'Error creando', 'Roles');
          this.log.error(this.isEditing ? 'roles actualizar' : 'roles crear', err);
          this.loading = false;
        },
      });
  }

  delete(rol: Rol): void {
    if (!rol.codigo) return;
    if (rol.codigo === this.PROPIETARIO_ROLE_CODE || rol.codigo === this.ADMIN_ROLE_CODE) {
      this.toast.showWarning(
        'No se puede eliminar un rol protegido (Propietario o Admin)',
        'Acción no permitida'
      );
      return;
    }
    this.rolToDelete = rol;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.rolToDelete?.codigo) {
      this.showDeleteModal = false;
      this.rolToDelete = null;
      return;
    }
    this.loading = true;
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    this.rolService
      .borrar(this.rolToDelete.codigo, context)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Rol eliminado', 'Roles');
          this.loading = false;
          this.showDeleteModal = false;
          this.rolToDelete = null;
          this.load();
        },
        error: (err: any) => {
          this.toast.showError('Error eliminando rol', 'Roles');
          this.log.error('roles borrar', err);
          this.loading = false;
          this.showDeleteModal = false;
          this.rolToDelete = null;
        },
      });
  }

  trackByRol(index: number, r: Rol): number | string {
    return r?.codigo ?? index;
  }

  trackByPrivilegio(index: number, p: Privilegio): number | string {
    return p?.idPrivilegio ?? p?.codigo ?? index;
  }
}
