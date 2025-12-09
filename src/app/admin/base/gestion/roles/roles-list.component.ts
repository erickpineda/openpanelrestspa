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

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.scss']
})
export class RolesListComponent implements OnInit, OnDestroy {
  readonly PROPIETARIO_ROLE_CODE = 'PROPIETARIO';

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
  isEditing = false;
  manualCodeEntry = false;

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
      this.loadPrivilegiosForRoles(this.roles);
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

  loadPrivilegiosForRoles(roles: Rol[]): void {
    roles.forEach(rol => {
      if (!rol.codigo) return; // Validación extra
      this.rolService.obtenerPrivilegios(rol.codigo)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            // Manejar respuesta paginada o lista directa
            const data = response?.data || response;
            const lista = Array.isArray(data?.elements) ? data.elements : (Array.isArray(data) ? data : []);
            
            // Asignar solo si es un array válido
            if (Array.isArray(lista)) {
              rol.privilegios = lista;
            }
          },
          error: (err) => {
            // Silencioso o log debug para no saturar consola
            // this.log.error(`Error cargando privilegios para rol ${rol.idRol}`, err);
          }
        });
    });
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
    this.isEditing = false;
    this.manualCodeEntry = false;
    this.editModalVisible = true;
  }

  openEdit(rol: Rol): void {
    this.editRol = JSON.parse(JSON.stringify(rol)); // Deep copy
    // Asegurar que privilegios es array
    if (!this.editRol!.privilegios) {
      this.editRol!.privilegios = [];
    }
    this.isEditing = true;
    this.editModalVisible = true;
  }

  closeEdit(): void {
    this.editModalVisible = false;
    this.editRol = null;
  }

  isRolFormValid(): boolean {
    return !!(this.editRol && this.editRol.nombre && this.editRol.nombre.trim().length > 0 && this.editRol.codigo && this.editRol.codigo.trim().length > 0);
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
    // Marcar como entrada manual si el usuario escribe algo (incluso si lo borra, asumimos que quiere control manual)
    // O si lo borra todo, ¿deberíamos volver a auto? 
    // Por simplicidad: si el usuario toca el código, es manual.
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
    
    // Guardamos la referencia a los privilegios para enviarlos después
    const privilegios = [...this.editRol.privilegios];
    // Opcional: limpiar privilegios del objeto principal si el backend no los acepta
    // this.editRol.privilegios = []; 
    
    const op$ = this.isEditing 
      ? this.rolService.actualizar(this.editRol.codigo, this.editRol)
      : this.rolService.crear(this.editRol);

    op$.pipe(
      takeUntil(this.destroy$),
      switchMap((res: any) => {
        // Si la creación/actualización fue exitosa, actualizamos privilegios
        // Nota: Si es crear, necesitamos el código del nuevo rol. 
        // Asumimos que el backend devuelve el objeto creado o usamos el código que enviamos.
        // Si el backend devuelve el objeto, lo usamos.
        const rolCode = this.isEditing ? this.editRol!.codigo : (res?.codigo || res?.data?.codigo || this.editRol!.codigo);
        
        if (privilegios && privilegios.length >= 0) {
          return this.rolService.actualizarPrivilegios(rolCode, privilegios);
        }
        return of(res);
      })
    ).subscribe({
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
      }
    });
  }

  delete(rol: Rol): void {
    if (!rol.codigo) return;
    if (rol.codigo === this.PROPIETARIO_ROLE_CODE) {
      this.toast.showWarning('No se puede eliminar el rol Propietario', 'Acción no permitida');
      return;
    }
    this.rolToDelete = rol;
    this.showDeleteModal = true;
    this.cdr.detectChanges(); // Forzar detección de cambios
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.rolToDelete = null;
    this.cdr.detectChanges(); // Forzar detección de cambios
  }

  confirmDelete(): void {
    if (!this.rolToDelete?.codigo) {
      this.cancelDelete();
      return;
    }
    this.loading = true;
    this.rolService.borrar(this.rolToDelete.codigo)
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
