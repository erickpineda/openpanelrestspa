import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { EtiquetaService } from '../../../core/services/data/etiqueta.service';
import { Etiqueta } from '../../../core/models/etiqueta.model';
import { PaginaResponse } from '../../../core/models/pagina-response.model';
import { ToastService } from '../../../core/services/ui/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SearchUtilService } from '../../../core/services/utils/search-util.service';

@Component({
  selector: 'app-etiquetas-list',
  templateUrl: './listado-etiquetas.component.html',
  styleUrls: ['./listado-etiquetas.component.scss'],
  standalone: false,
})
export class EtiquetasListComponent implements OnInit, OnDestroy {
  etiquetas: Etiqueta[] = [];
  pagedEtiquetas: Etiqueta[] = [];
  allEtiquetas: Etiqueta[] = [];
  loading = false;
  totalItems = 0;
  pageSize = 5;
  pageNo = 0;
  totalPages = 1;
  numberOfElements = 0;
  showDeleteModal = false;
  etiquetaToDelete: Etiqueta | null = null;
  showAdvanced = false;
  basicSearchText = '';

  searchForm: FormGroup;
  showCreateModal = false;
  showEditModal = false;
  selectedEtiqueta: Etiqueta | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private etiquetasService: EtiquetaService,
    private fb: FormBuilder,
    private toast: ToastService,
    private log: LoggerService,
    private searchUtil: SearchUtilService,
    private cdr: ChangeDetectorRef,
  ) {
    this.searchForm = this.fb.group({
      nombre: [''],
      descripcion: [''],
    });
  }

  ngOnInit(): void {
    this.loadEtiquetas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEtiquetas(): void {
    this.loading = true;
    const nombre = (this.searchForm.get('nombre')?.value || '').trim();
    const descripcion = (
      this.searchForm.get('descripcion')?.value || ''
    ).trim();
    const hasFilters = !!(this.basicSearchText || nombre || descripcion);
    if (!hasFilters) {
      this.etiquetasService
        .listarPaginaSinGlobalLoader(this.pageNo, this.pageSize)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading = false;
            this.cdr.detectChanges();
          }),
        )
        .subscribe({
          next: (response: any) => {
            const data = response?.data ?? response;
            this.setPageData(data as PaginaResponse);
            this.cdr.detectChanges();
          },
          error: (error: any) => {
            this.toast.showError('Error cargando etiquetas', 'Etiquetas');
            this.log.error('etiquetas listar', error);
            this.cdr.detectChanges();
          },
        });
      return;
    }

    const criteria: { filterKey: string; value: any; operation: string }[] = [];
    if (this.basicSearchText)
      criteria.push({
        filterKey: 'nombre',
        value: this.basicSearchText,
        operation: 'CONTAINS',
      });
    if (nombre)
      criteria.push({
        filterKey: 'nombre',
        value: nombre,
        operation: 'CONTAINS',
      });
    if (descripcion)
      criteria.push({
        filterKey: 'descripcion',
        value: descripcion,
        operation: 'CONTAINS',
      });
    const searchRequest = this.searchUtil.buildRequest(
      'Etiqueta',
      criteria,
      'AND',
    );

    this.etiquetasService
      .buscarSinGlobalLoader(searchRequest, this.pageNo, this.pageSize)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;
          this.setPageData(data as PaginaResponse);
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.toast.showError('Error cargando etiquetas', 'Etiquetas');
          this.log.error('etiquetas listar', error);
          this.cdr.detectChanges();
        },
      });
  }

  onSearch(): void {
    this.pageNo = 0;
    this.loadEtiquetas();
  }

  onPageChange(page: number): void {
    this.pageNo = Math.max(0, page);
    this.loadEtiquetas();
  }

  onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text;
    this.onSearch();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size) || 5;
    this.onPageChange(0);
    this.applyPaging();
  }

  onPrev(): void {
    if (this.pageNo > 0) {
      this.onPageChange(this.pageNo - 1);
    }
  }

  onNext(): void {
    if (this.pageNo < Math.max(0, this.getTotalPages() - 1)) {
      this.onPageChange(this.pageNo + 1);
    }
  }

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  onCreate(): void {
    this.selectedEtiqueta = null;
    this.showCreateModal = true;
  }

  onEdit(etiqueta: Etiqueta): void {
    this.selectedEtiqueta = { ...etiqueta };
    this.showEditModal = true;
  }

  onDelete(etiqueta: Etiqueta): void {
    this.etiquetaToDelete = etiqueta;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.etiquetaToDelete?.idEtiqueta) {
      this.showDeleteModal = false;
      return;
    }
    this.loading = true;
    this.etiquetasService
      .borrar(this.etiquetaToDelete.idEtiqueta!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Etiqueta eliminada', 'Etiquetas');
          this.loading = false;
          this.showDeleteModal = false;
          this.etiquetaToDelete = null;
          this.loadEtiquetas();
        },
        error: (error: any) => {
          this.toast.showError('Error eliminando etiqueta', 'Etiquetas');
          this.log.error('etiquetas eliminar', error);
          this.loading = false;
          this.showDeleteModal = false;
          this.etiquetaToDelete = null;
        },
      });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.etiquetaToDelete = null;
  }

  onModalClose(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedEtiqueta = null;
  }

  onModalSave(): void {
    this.onModalClose();
    this.onPageChange(0);
  }

  onModalVisibleChange(visible: boolean): void {
    if (!visible) {
      this.onModalClose();
    }
  }

  getPaginationArray(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  getTotalPages(): number {
    return Math.max(
      1,
      Number(
        this.totalPages || Math.ceil(this.totalItems / this.pageSize) || 1,
      ),
    );
  }

  isNextDisabled(): boolean {
    return this.pageNo >= Math.max(0, this.getTotalPages() - 1);
  }

  private setPageData(data: PaginaResponse): void {
    const raw = (data?.elements ??
      (data as any)?.items ??
      (data as any)?.content ??
      []) as any[];
    const mapped = Array.isArray(raw)
      ? (raw.map((e: any) => ({
          idEtiqueta: e?.idEtiqueta ?? e?.id ?? e?.id_tag ?? e?.idLabel,
          nombre: e?.nombre ?? e?.name,
          frecuencia: e?.frecuencia ?? 0,
          descripcion: e?.descripcion ?? e?.description,
          colorHex: e?.colorHex ?? e?.color ?? '#4ECDC4',
        })) as Etiqueta[])
      : [];

    const hasServerPaging =
      typeof (data as any)?.totalPages === 'number' ||
      typeof (data as any)?.totalElements === 'number';

    if (hasServerPaging) {
      this.etiquetas = mapped;
      this.totalItems = Number(
        (data as any)?.totalElements ?? mapped.length ?? 0,
      );
      this.totalPages = Number(
        (data as any)?.totalPages ??
          Math.ceil(this.totalItems / this.pageSize) ??
          1,
      );
      this.numberOfElements = Number(
        (data as any)?.numberOfElements ?? mapped.length,
      );
      this.pagedEtiquetas = mapped;
      if (
        mapped.length === 0 &&
        this.pageNo > 0 &&
        this.pageNo >= this.totalPages
      ) {
        this.pageNo = Math.max(0, this.totalPages - 1);
        this.loadEtiquetas();
        return;
      }
    } else {
      this.allEtiquetas = mapped;
      const total = this.allEtiquetas.length;
      this.totalItems = total;
      this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
      if (this.pageNo >= this.totalPages)
        this.pageNo = Math.max(0, this.totalPages - 1);
      const start = this.pageNo * this.pageSize;
      const end = start + this.pageSize;
      this.pagedEtiquetas = this.allEtiquetas.slice(start, end);
      this.numberOfElements = this.pagedEtiquetas.length;
      this.etiquetas = this.pagedEtiquetas;
    }
  }

  private applyPaging(): void {
    const total = this.allEtiquetas?.length ?? 0;
    if (total > 0) {
      this.totalItems = total;
      this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
      if (this.pageNo >= this.totalPages)
        this.pageNo = Math.max(0, this.totalPages - 1);
      const start = this.pageNo * this.pageSize;
      const end = start + this.pageSize;
      this.pagedEtiquetas = this.allEtiquetas.slice(start, end);
      this.numberOfElements = this.pagedEtiquetas.length;
      this.cdr.detectChanges();
    }
  }

  trackByEtiqueta(index: number, e: Etiqueta): number | string {
    return e?.idEtiqueta ?? e?.nombre ?? index;
  }
}
