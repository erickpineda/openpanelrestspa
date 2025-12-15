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
  templateUrl: './listado-roles.component.html',
  styleUrls: ['./listado-roles.component.scss']
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
      console.log(this.roles)
      this.totalElements = Number(data?.totalElements || list.length || 0);
      this.numberOfElements = list.length;
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
    const codigos = roles.map(r => r.codigo).filter(c => !!c);
    
    if (codigos.length === 0) return;

    // Limpiar privilegios actuales de los roles cargados antes de empezar
    roles.forEach(r => r.privilegios = []);

    this.fetchPrivilegiosRecursively(codigos, 0, roles);
  }

  private fetchPrivilegiosRecursively(codigos: string[], pageNo: number, roles: Rol[]): void {
    const PAGE_SIZE = 50; // Ajustable según necesidad

    this.rolService.obtenerPorCodigos(codigos, pageNo, PAGE_SIZE)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const data = response?.data || response;
          const elements = Array.isArray(data?.elements) ? data.elements : (Array.isArray(data) ? data : []);
          
          // Procesar elementos de esta página
          elements.forEach((item: any) => {
            // Intentar buscar por ID si existe, sino por nombre como fallback (según código previo que usaba nombre)
            // Pero idealmente usar ID o Código si está disponible. El usuario mostró un JSON con idRol.
            const rol = roles.find(r => r.nombre === item.rolNombre);
            if (rol) {
              const priv = new Privilegio();
              priv.idPrivilegio = item.idPrivilegio;
              priv.nombre = item.privilegioNombre;
              priv.codigo = item.privilegioCodigo;
              priv.descripcion = item.privilegioDescripcion;
              
              rol.privilegios.push(priv);
            }
          });

          // Comprobar si hay más páginas
          const totalPages = data?.totalPages || 0;
          if (pageNo < totalPages - 1) {
            this.fetchPrivilegiosRecursively(codigos, pageNo + 1, roles);
          }
        },
        error: (err) => {
           this.log.error(`Error cargando privilegios para roles (página ${pageNo})`, err);
        }
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
    this.editRol = JSON.parse(JSON.stringify(rol)); // Deep copy
    // Asegurar que privilegios es array
    if (!this.editRol!.privilegios) {
      this.editRol!.privilegios = [];
    }

    // RESTRICCION: Propietario siempre debe tener todos los privilegios
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

  /**
   * Cambia el estado de un privilegio para el rol que se está editando.
   * Si checked es true, lo añade; si es false, lo elimina.
   * @param privilegio El privilegio a modificar.
   * @param checked Estado del checkbox.
   */
  togglePrivilegio(privilegio: Privilegio, checked: boolean): void {
    if (!this.editRol) return;

    // RESTRICCION: Propietario no se le pueden quitar privilegios
    if (this.editRol.codigo === this.PROPIETARIO_ROLE_CODE && !checked) {
       // Forzar visualmente a true si angular no lo hace solo, aunque el modelo no cambie
       // El binding [checked] debería encargarse, pero por si acaso no hacemos nada.
       return;
    }

    if (checked) {
      // Agregar si no existe
      if (!this.editRol.privilegios.some(p => p.codigo === privilegio.codigo)) {
        this.editRol.privilegios.push(privilegio);
      }
    } else {
      // Remover
      this.editRol.privilegios = this.editRol.privilegios.filter(p => p.codigo !== privilegio.codigo);
    }
  }

  /**
   * Comprueba si un privilegio específico está asignado al rol actual.
   * @param privilegio El privilegio a verificar.
   * @returns true si está asignado, false en caso contrario.
   */
  hasPrivilegio(privilegio: Privilegio): boolean {
    if (!this.editRol || !this.editRol.privilegios) return false;
    return this.editRol.privilegios.some(p => p.idPrivilegio === privilegio.idPrivilegio);
  }

  /**
   * Determina si TODOS los privilegios disponibles están seleccionados.
   * Se usa para el estado 'checked' del checkbox "Seleccionar todos".
   */
  areAllPrivilegiosSelected(): boolean {
    if (!this.editRol || !this.editRol.privilegios || this.privilegios.length === 0) return false;
    const rolPrivilegiosIds = this.editRol.privilegios.map(p => p.idPrivilegio);
    return this.privilegios.every(p => rolPrivilegiosIds.includes(p.idPrivilegio));
  }

  /**
   * Determina si ALGUNOS (pero no todos) privilegios están seleccionados.
   * Se usa para el estado 'indeterminate' del checkbox "Seleccionar todos".
   */
  areSomePrivilegiosSelected(): boolean {
    if (!this.editRol || !this.editRol.privilegios || this.privilegios.length === 0) return false;
    const count = this.editRol.privilegios.length;
    return count > 0 && count < this.privilegios.length;
  }

  /**
   * Selecciona o deselecciona todos los privilegios disponibles.
   * @param checked true para seleccionar todos, false para deseleccionar todos.
   */
  toggleAllPrivilegios(checked: boolean): void {
    if (!this.editRol) return;
    
    // RESTRICCION: Propietario no se puede deseleccionar todos
    if (this.editRol.codigo === this.PROPIETARIO_ROLE_CODE && !checked) {
      return;
    }

    if (checked) {
      // Agregar todos los que faltan
      // Clonamos para evitar referencias cruzadas
      this.editRol.privilegios = JSON.parse(JSON.stringify(this.privilegios));
    } else {
      // Quitar todos
      this.editRol.privilegios = [];
    }
  }

  saveEdit(): void {
    if (!this.editRol) return;
    this.loading = true;

    // RESTRICCION: Propietario siempre debe tener todos los privilegios (incluso los nuevos que no se hayan mostrado)
     if (this.editRol.codigo === this.PROPIETARIO_ROLE_CODE) {
        this.editRol.privilegios = JSON.parse(JSON.stringify(this.privilegios));
     }
 
     // RESTRICCION: Admin debe tener al menos un privilegio (o conjunto esencial)
     if (this.editRol.codigo === this.ADMIN_ROLE_CODE) {
        if (!this.editRol.privilegios || this.editRol.privilegios.length === 0) {
          this.toast.showWarning('El rol de Administrador no puede quedar sin privilegios.', 'Validación');
          this.loading = false;
          return;
        }
     }
    
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
        
        if (privilegios) {
          const codigos = privilegios.map(p => p.codigo);
          return this.rolService.actualizarPrivilegios(rolCode, codigos);
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
    if (rol.codigo === this.PROPIETARIO_ROLE_CODE || rol.codigo === this.ADMIN_ROLE_CODE) {
      this.toast.showWarning('No se puede eliminar un rol protegido (Propietario o Admin)', 'Acción no permitida');
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
