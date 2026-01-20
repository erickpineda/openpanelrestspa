import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AjustesService } from '../../../../core/services/data/ajustes.service';
import { Ajustes } from '../../../../core/models/ajustes.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.scss'],
  standalone: false,
})
export class AjustesComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  ajustes: Ajustes[] = [];
  modalVisible = false;
  showDeleteModal = false;
  editItem: Ajustes | null = null;
  itemToDelete: Ajustes | null = null;
  form: FormGroup;
  private destroy$ = new Subject<void>();

  get isEditing(): boolean {
    return !!this.editItem;
  }

  // Patrón de toolbar/búsqueda/paginación
  basicSearchText: string = '';
  showAdvanced: boolean = false;
  filtroCategoria: string = '';
  filtroClave: string = '';
  pageSize: number = 10;
  pageNo: number = 0;
  totalElements: number = 0;
  filteredAjustes: Ajustes[] = [];
  pagedAjustes: Ajustes[] = [];

  constructor(
    private ajustesService: AjustesService,
    private fb: FormBuilder,
    private toast: ToastService,
    private log: LoggerService,
    private cdr: ChangeDetectorRef,
    private translate: TranslationService
  ) {
    this.form = this.fb.group({
      categoria: ['', [Validators.required, Validators.maxLength(50)]],
      clave: ['', [Validators.required, Validators.maxLength(50)]],
      valor: ['', [Validators.required, Validators.maxLength(200)]],
    });
  }

  ngOnInit(): void {
    this.load();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    this.error = null;

    this.ajustesService
      .listarSafeSinGlobalLoader()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (list: Ajustes[]) => {
          this.ajustes = Array.isArray(list) ? list : [];
          this.totalElements = this.ajustes.length;
          this.search();
        },
        error: (err) => {
          this.error = 'Error cargando ajustes';
          this.log.error('ajustes listar', err);
        },
      });
  }

  openNew(): void {
    this.editItem = null;
    this.form.reset({ categoria: '', clave: '', valor: '' });
    this.modalVisible = true;
  }

  openEdit(item: Ajustes): void {
    this.editItem = { ...item };
    this.form.reset({
      categoria: item.categoria || '',
      clave: item.clave || '',
      valor: item.valor || '',
    });
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible = false;
    this.editItem = null;
  }

  save(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const payload: Ajustes = { ...this.form.value };
    const op = this.editItem?.id
      ? this.ajustesService.actualizarSafe(this.editItem.id, payload)
      : this.ajustesService.crearSafe(payload);

    op.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.showSuccess(
          this.isEditing
            ? this.translate.instant('ADMIN.SETTINGS.SUCCESS.UPDATE')
            : this.translate.instant('ADMIN.SETTINGS.SUCCESS.CREATE'),
          this.translate.instant('MENU.SETTINGS')
        );
        this.loading = false;
        this.modalVisible = false;
        this.load();
      },
      error: (err) => {
        this.toast.showError(
          this.isEditing
            ? this.translate.instant('ADMIN.SETTINGS.ERROR.UPDATE')
            : this.translate.instant('ADMIN.SETTINGS.ERROR.CREATE'),
          this.translate.instant('MENU.SETTINGS')
        );
        this.log.error('ajustes guardar', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  delete(item: Ajustes): void {
    if (!item.id) return;
    this.itemToDelete = item;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.itemToDelete || !this.itemToDelete.id) return;
    this.loading = true;
    this.ajustesService.eliminarSafe(this.itemToDelete.id).subscribe({
      next: () => {
        this.toast.showSuccess(
          this.translate.instant('ADMIN.SETTINGS.SUCCESS.DELETE'),
          this.translate.instant('MENU.SETTINGS')
        );
        this.loading = false;
        this.showDeleteModal = false;
        this.itemToDelete = null;
        this.load();
      },
      error: (err) => {
        this.toast.showError(
          this.translate.instant('ADMIN.SETTINGS.ERROR.DELETE'),
          this.translate.instant('MENU.SETTINGS')
        );
        this.log.error('ajustes eliminar', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ===== Toolbar / Búsqueda / Paginación =====
  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }
  onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text || '';
    this.pageNo = 0;
    this.search();
  }
  onPageSizeChange(size: number): void {
    this.pageSize = Number(size) || 10;
    this.pageNo = 0;
    this.updatePage();
  }

  search(): void {
    const term = (this.basicSearchText || '').toLowerCase();
    const categoria = (this.filtroCategoria || '').toLowerCase();
    const clave = (this.filtroClave || '').toLowerCase();
    const base = this.ajustes || [];
    this.filteredAjustes = base.filter((a) => {
      const c = (a.categoria || '').toLowerCase();
      const k = (a.clave || '').toLowerCase();
      const v = (a.valor || '').toLowerCase();
      const mBasic = !term || c.includes(term) || k.includes(term) || v.includes(term);
      const mCat = !categoria || c.includes(categoria);
      const mClave = !clave || k.includes(clave);
      return mBasic && mCat && mClave;
    });
    this.totalElements = this.filteredAjustes.length;
    this.pageNo = 0;
    this.updatePage();
  }

  reset(): void {
    this.basicSearchText = '';
    this.filtroCategoria = '';
    this.filtroClave = '';
    this.pageNo = 0;
    this.search();
  }

  onPageChange(page: number): void {
    const totalPages = this.getTotalPages();
    const safePage = Math.max(0, Math.min(Number(page) || 0, Math.max(0, totalPages - 1)));
    if (safePage === this.pageNo) return;
    this.pageNo = safePage;
    this.updatePage();
  }

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.pageSize));
  }

  private updatePage(): void {
    const start = this.pageNo * this.pageSize;
    const end = start + this.pageSize;
    this.pagedAjustes = this.filteredAjustes.slice(start, end);
  }

  trackByAjuste(index: number, a: Ajustes): number | string {
    return a?.id ?? `${a?.categoria || ''}-${a?.clave || ''}`;
  }
}
