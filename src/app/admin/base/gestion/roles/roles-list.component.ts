import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { RolService } from '../../../../core/services/data/rol.service';
import { Rol } from '../../../../core/models/rol.model';
import { PrivilegioService } from '../../../../core/services/data/privilegio.service';
import { Privilegio } from '../../../../core/models/privilegio.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { SearchUtilService } from '../../../../core/services/utils/search-util.service';
import { OPConstants } from '../../../../shared/constants/op-global.constants';

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.scss']
})
export class RolesListComponent implements OnInit, OnDestroy {
  readonly PROPIETARIO_ROLE_ID = OPConstants.Roles.PROPIETARIO;

  loading = false;
  error: string | null = null;
  roles: Rol[] = [];
  privilegios: Privilegio[] = [];
  
  pageNo = 0;
  pageSize = 10;
  totalElements = 0;

  showAdvanced = false;
  basicSearchText = '';
  filtroNombre = '';

  editModalVisible = false;
  editRol: Rol | null = null;

  showDeleteModal = false;
  rolToDelete: Rol | null = null;

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

    const hasFilters = !!(this.filtroNombre);

    const handleResponse = (r: any) => {
      const data = r?.data || r;
      const list = Array.isArray(data?.elements) ? data.elements : (Array.isArray(data) ? data : []);
      this.roles = list.map((item: any) => {
        // Mapear permisos a privilegios si es necesario
        if (!item.privilegios && item.permisos) {
          item.privilegios = item.permisos;
        }
        return item;
      });
      this.totalElements = Number(data?.totalElements || list.length || 0);
    };

    const handleError = (err: any) => {
      this.error = 'Error cargando roles';
      this.log.error('roles listar', err);
    };

    if (!hasFilters) {
      this.rolService.listarPaginaSinGlobalLoader(pageNo, this.pageSize)
        .pipe(takeUntil(this.destroy$), finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }))
        .subscribe({ next: handleResponse, error: handleError });
    } else {
      const criteria: { filterKey: string; value: any; operation: string }[] = [];
      if (this.filtroNombre) criteria.push({ filterKey: 'nombre', value: this.filtroNombre, operation: 'CONTAINS' });
      
      const payload = this.searchUtil.buildRequest('Rol', criteria, 'ALL');
      this.rolService.buscarSinGlobalLoader(payload, pageNo, this.pageSize)
        .pipe(takeUntil(this.destroy$), finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }))
        .subscribe({ next: handleResponse, error: handleError });
    }
  }

  loadPrivilegios(): void {
    // Cargar todos los privilegios disponibles para el selector (usando un tamaño de página grande para traer todos)
    this.privilegioService.listarSafe(0, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (privilegios) => {
          this.privilegios = privilegios || [];
        },
        error: (err) => {
          this.log.error('Error cargando privilegios', err);
        }
      });
  }

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text;
    this.filtroNombre = text;
    // Debounce manual simple si fuera necesario, pero por ahora directo o esperar enter
    // Aquí implementamos búsqueda al escribir si se desea, o solo actualizar el modelo
    // Para mantener consistencia con usuarios, actualizamos filtro y buscamos si es básico
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
    this.pageNo = 0;
    this.load();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageNo = 0;
    this.load();
  }

  prev(): void { if (this.pageNo > 0) { this.pageNo--; this.load(); } }
  next(): void { 
    const maxPage = this.totalElements ? Math.ceil(this.totalElements / this.pageSize) - 1 : this.pageNo + 1;
    if (this.pageNo < maxPage) { this.pageNo++; this.load(); } 
  }
  getTotalPages(): number { return this.totalElements ? Math.ceil(this.totalElements / this.pageSize) : 0; }

  // CRUD

  openCreate(): void {
    this.editRol = new Rol();
    this.editModalVisible = true;
  }

  openEdit(rol: Rol): void {
    this.editRol = JSON.parse(JSON.stringify(rol)); // Deep copy
    // Asegurar que privilegios es array
    if (!this.editRol!.privilegios) {
      this.editRol!.privilegios = [];
    }
    this.editModalVisible = true;
  }

  closeEdit(): void {
    this.editModalVisible = false;
    this.editRol = null;
  }

  isRolFormValid(): boolean {
    return !!(this.editRol && this.editRol.nombre && this.editRol.nombre.trim().length > 0);
  }

  togglePrivilegio(privilegio: Privilegio, checked: boolean): void {
    if (!this.editRol) return;
    if (checked) {
      // Agregar si no existe
      if (!this.editRol.privilegios.some(p => p.idPrivilegio === privilegio.idPrivilegio)) {
        this.editRol.privilegios.push(privilegio);
      }
    } else {
      // Remover
      this.editRol.privilegios = this.editRol.privilegios.filter(p => p.idPrivilegio !== privilegio.idPrivilegio);
    }
  }

  hasPrivilegio(privilegio: Privilegio): boolean {
    if (!this.editRol || !this.editRol.privilegios) return false;
    return this.editRol.privilegios.some(p => p.idPrivilegio === privilegio.idPrivilegio);
  }

  saveEdit(): void {
    if (!this.editRol) return;
    this.loading = true;
    const hasId = !!this.editRol.idRol && this.editRol.idRol > 0;
    
    const op$ = hasId 
      ? this.rolService.actualizar(this.editRol.idRol, this.editRol)
      : this.rolService.crear(this.editRol);

    op$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.showSuccess(hasId ? 'Rol actualizado' : 'Rol creado', 'Roles');
        this.loading = false;
        this.editModalVisible = false;
        this.load();
      },
      error: (err: any) => {
        this.toast.showError(hasId ? 'Error actualizando' : 'Error creando', 'Roles');
        this.log.error(hasId ? 'roles actualizar' : 'roles crear', err);
        this.loading = false;
      }
    });
  }

  delete(rol: Rol): void {
    if (!rol.idRol) return;
    if (rol.idRol === this.PROPIETARIO_ROLE_ID) {
      this.toast.showWarning('No se puede eliminar el rol Propietario', 'Acción no permitida');
      return;
    }
    this.rolToDelete = rol;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.rolToDelete = null;
  }

  confirmDelete(): void {
    if (!this.rolToDelete?.idRol) {
      this.cancelDelete();
      return;
    }
    this.loading = true;
    this.rolService.borrar(this.rolToDelete.idRol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Rol eliminado', 'Roles');
          this.loading = false;
          this.cancelDelete();
          this.load();
        },
        error: (err: any) => {
          this.toast.showError('Error eliminando rol', 'Roles');
          this.log.error('roles borrar', err);
          this.loading = false;
          this.cancelDelete();
        }
      });
  }
}
