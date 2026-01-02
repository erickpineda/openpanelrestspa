import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { finalize, takeUntil, switchMap } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { PrivilegioService } from '../../../../core/services/data/privilegio.service';
import { Privilegio } from '../../../../core/models/privilegio.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { SearchUtilService } from '../../../../core/services/utils/search-util.service';

@Component({
  selector: 'app-privilegios-list',
  templateUrl: './listado-privilegios.component.html',
  styleUrls: ['./listado-privilegios.component.scss'],
  standalone: false,
})
export class PrivilegiosListComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  privilegios: Privilegio[] = [];

  pageNo = 0;
  pageSize = 10;
  totalElements = 0;
  numberOfElements = 0;

  showAdvanced = false;
  basicSearchText = '';
  filtroNombre = '';

  editModalVisible = false;
  editPrivilegio: Privilegio | null = null;
  isEditing = false;
  manualCodeEntry = false;

  showDeleteModal = false;
  privilegioToDelete: Privilegio | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private privilegioService: PrivilegioService,
    private toast: ToastService,
    private log: LoggerService,
    private searchUtil: SearchUtilService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
      this.privilegios = list;
      this.totalElements = Number(data?.totalElements || list.length || 0);
      this.numberOfElements = list.length;
    };

    const handleError = (err: any) => {
      this.error = 'Error cargando privilegios';
      this.log.error('privilegios listar', err);
    };

    if (!hasFilters) {
      this.privilegioService
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

      const payload = this.searchUtil.buildRequest('Privilegio', criteria, 'ALL');
      this.privilegioService
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
    this.pageNo = 0;
    this.load();
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

  // CRUD

  openCreate(): void {
    this.editPrivilegio = new Privilegio();
    this.isEditing = false;
    this.manualCodeEntry = false;
    this.editModalVisible = true;
  }

  openEdit(privilegio: Privilegio): void {
    this.editPrivilegio = JSON.parse(JSON.stringify(privilegio)); // Deep copy
    this.isEditing = true;
    this.editModalVisible = true;
  }

  closeEdit(): void {
    this.editModalVisible = false;
    this.editPrivilegio = null;
  }

  isFormValid(): boolean {
    return !!(
      this.editPrivilegio &&
      this.editPrivilegio.nombre &&
      this.editPrivilegio.nombre.trim().length > 0 &&
      this.editPrivilegio.codigo &&
      this.editPrivilegio.codigo.trim().length > 0
    );
  }

  onNombreInput(value: string): void {
    if (!this.editPrivilegio) return;
    this.editPrivilegio.nombre = value;

    if (!this.isEditing && !this.manualCodeEntry) {
      this.generateCodeFromNombre(value);
    }
  }

  onCodigoInput(value: string): void {
    if (!this.editPrivilegio) return;
    this.editPrivilegio.codigo = value.toUpperCase();
    this.manualCodeEntry = true;
  }

  private generateCodeFromNombre(nombre: string): void {
    if (!this.editPrivilegio) return;
    let code = nombre.replace(/\s/g, '').substring(0, 10).toUpperCase();
    this.editPrivilegio.codigo = code;
  }

  saveEdit(): void {
    if (!this.editPrivilegio) return;
    this.loading = true;

    const op$ = this.isEditing
      ? this.privilegioService.actualizar(this.editPrivilegio.codigo, this.editPrivilegio)
      : this.privilegioService.crear(this.editPrivilegio);

    op$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.showSuccess(
          this.isEditing ? 'Privilegio actualizado' : 'Privilegio creado',
          'Privilegios'
        );
        this.loading = false;
        this.editModalVisible = false;
        this.load();
      },
      error: (err: any) => {
        this.toast.showError(
          this.isEditing ? 'Error actualizando' : 'Error creando',
          'Privilegios'
        );
        this.log.error(this.isEditing ? 'privilegios actualizar' : 'privilegios crear', err);
        this.loading = false;
      },
    });
  }

  delete(privilegio: Privilegio): void {
    if (!privilegio.codigo) return;
    this.privilegioToDelete = privilegio;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.privilegioToDelete = null;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.privilegioToDelete?.codigo) {
      this.cancelDelete();
      return;
    }
    this.loading = true;
    this.privilegioService
      .borrar(this.privilegioToDelete.codigo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Privilegio eliminado', 'Privilegios');
          this.loading = false;
          this.cancelDelete();
          this.load();
        },
        error: (err: any) => {
          this.toast.showError('Error eliminando privilegio', 'Privilegios');
          this.log.error('privilegios borrar', err);
          this.loading = false;
          this.cancelDelete();
        },
      });
  }

  trackByPrivilegio(index: number, p: Privilegio): number | string {
    return p?.idPrivilegio ?? p?.codigo ?? index;
  }
}
