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
  pageSize = 10;
  currentPage = 1;
  
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
    const searchPayload = this.searchForm.value;

    this.etiquetasService.buscar(searchPayload, this.currentPage - 1, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.etiquetas = response.content || response.items || response.elements || response;
          this.totalItems = response.totalElements || response.total || this.etiquetas.length;
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

  onCreate(): void { this.selectedEtiqueta = null; this.showCreateModal = true; }
  onEdit(etiqueta: EtiquetaDTO): void { this.selectedEtiqueta = { ...etiqueta }; this.showEditModal = true; }

  onDelete(etiqueta: EtiquetaDTO): void {
    if (confirm(`¿Está seguro de eliminar la etiqueta "${etiqueta.nombre}"?`)) {
      this.loading = true;
      this.etiquetasService.borrar(etiqueta.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => { this.toast.showSuccess('Etiqueta eliminada', 'Etiquetas'); this.loadEtiquetas(); },
          error: (error: any) => { this.toast.showError('Error eliminando etiqueta', 'Etiquetas'); this.log.error('etiquetas eliminar', error); this.loading = false; }
        });
    }
  }

  onModalClose(): void { this.showCreateModal = false; this.showEditModal = false; this.selectedEtiqueta = null; }
  onModalSave(): void { this.onModalClose(); this.loadEtiquetas(); }

  getPaginationArray(): number[] { const totalPages = this.getTotalPages(); return Array.from({ length: totalPages }, (_, i) => i + 1); }
  getTotalPages(): number { return Math.ceil(this.totalItems / this.pageSize); }
}
