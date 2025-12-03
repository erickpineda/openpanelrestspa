import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EtiquetasService, EtiquetaDTO } from '../../../core/services/etiquetas.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-etiquetas-list',
  templateUrl: './etiquetas-list.component.html',
  styleUrls: ['./etiquetas-list.component.scss']
})
export class EtiquetasListComponent implements OnInit, OnDestroy {
  etiquetas: EtiquetaDTO[] = [];
  loading = false;
  totalItems = 0;
  pageSize = 5;
  currentPage = 1;
  showDeleteModal = false;
  etiquetaToDelete: EtiquetaDTO | null = null;
  showAdvanced = false;
  basicSearchText = '';
  
  searchForm: FormGroup;
  showCreateModal = false;
  showEditModal = false;
  selectedEtiqueta: EtiquetaDTO | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private etiquetasService: EtiquetasService,
    private fb: FormBuilder,
    private toast: ToastService,
    private log: LoggerService
  ) {
    this.searchForm = this.fb.group({
      nombre: [''],
      descripcion: ['']
    });
  }

  ngOnInit(): void { this.loadEtiquetas(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadEtiquetas(): void {
    this.loading = true;
    //const searchPayload = this.searchForm.value;
    const searchRequest = {
      dataOption: 'AND',
      searchCriteriaList: [{
        filterKey: 'nombre',
        value: this.basicSearchText || '',
        operation: 'CONTAINS',
        clazzName: 'Etiqueta'
      }]
    };

    this.etiquetasService.buscar(searchRequest, this.currentPage - 1, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;
          const raw = (data?.elements ?? data?.items ?? data?.content ?? []) as any[];
          const mapped = Array.isArray(raw) ? raw.map((e: any) => ({
            id: e?.id ?? e?.idEtiqueta ?? e?.id_tag ?? e?.idLabel,
            nombre: e?.nombre ?? e?.name,
            descripcion: e?.descripcion ?? e?.description,
            colorHex: e?.colorHex ?? e?.color ?? '#4ECDC4',
            fechaCreacion: e?.fechaCreacion ?? e?.createdAt ?? e?.fechaRegistro
          })) as EtiquetaDTO[] : [];
          this.etiquetas = mapped.length > this.pageSize ? mapped.slice(0, this.pageSize) : mapped;
          this.totalItems = (data?.totalElements ?? data?.total ?? this.etiquetas.length) as number;
          this.loading = false;
        },
        error: (error: any) => {
          this.toast.showError('Error cargando etiquetas', 'Etiquetas');
          this.log.error('etiquetas listar', error);
          this.loading = false;
        }
      });
  }

  onSearch(): void { this.currentPage = 1; this.loadEtiquetas(); }
  onPageChange(page: number): void { this.currentPage = page; this.loadEtiquetas(); }

  onBasicSearchTextChange(text: string): void { this.basicSearchText = text; this.onSearch(); }
  onPageSizeChange(size: number): void { this.pageSize = size; this.onPageChange(1); }
  onPrev(): void { if (this.currentPage > 1) { this.onPageChange(this.currentPage - 1); } }
  onNext(): void { const totalPages = this.getTotalPages(); if (this.currentPage < totalPages) { this.onPageChange(this.currentPage + 1); } }
  toggleAdvanced(): void { this.showAdvanced = !this.showAdvanced; }

  onCreate(): void { this.selectedEtiqueta = null; this.showCreateModal = true; }
  onEdit(etiqueta: EtiquetaDTO): void { this.selectedEtiqueta = { ...etiqueta }; this.showEditModal = true; }

  onDelete(etiqueta: EtiquetaDTO): void {
    this.etiquetaToDelete = etiqueta;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.etiquetaToDelete?.id) { this.showDeleteModal = false; return; }
    this.loading = true;
    this.etiquetasService.borrar(this.etiquetaToDelete.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.toast.showSuccess('Etiqueta eliminada', 'Etiquetas'); this.loading = false; this.showDeleteModal = false; this.etiquetaToDelete = null; this.loadEtiquetas(); },
        error: (error: any) => { this.toast.showError('Error eliminando etiqueta', 'Etiquetas'); this.log.error('etiquetas eliminar', error); this.loading = false; this.showDeleteModal = false; this.etiquetaToDelete = null; }
      });
  }

  cancelDelete(): void { this.showDeleteModal = false; this.etiquetaToDelete = null; }

  onModalClose(): void { this.showCreateModal = false; this.showEditModal = false; this.selectedEtiqueta = null; }
  onModalSave(): void { this.onModalClose(); this.onPageChange(1); }

  onModalVisibleChange(visible: boolean): void {
    if (!visible) { this.onModalClose(); }
  }

  getPaginationArray(): number[] { const totalPages = this.getTotalPages(); return Array.from({ length: totalPages }, (_, i) => i + 1); }
  getTotalPages(): number { return Math.ceil(this.totalItems / this.pageSize); }
}
