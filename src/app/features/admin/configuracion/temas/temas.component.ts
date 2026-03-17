import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { TemasService } from '../../../../core/services/data/temas.service';
import { Tema } from '../../../../core/models/tema.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { SKIP_GLOBAL_ERROR_HANDLING } from '../../../../core/interceptor/error.interceptor';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-temas',
  templateUrl: './temas.component.html',
  styleUrls: ['./temas.component.scss'],
  standalone: false,
})
export class TemasComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  temas: Tema[] = [];
  modalVisible = false;
  showDeleteModal = false;
  editItem: Tema | null = null;
  itemToDelete: Tema | null = null;
  form: FormGroup;
  private destroy$ = new Subject<void>();

  get isEditing(): boolean {
    return !!this.editItem;
  }

  // Patrón de toolbar/búsqueda/paginación
  basicSearchText: string = '';
  showAdvanced: boolean = false;
  filtroNombre: string = '';
  filtroActivo: boolean | null = null;
  pageSize: number = 10;
  pageNo: number = 0;
  totalElements: number = 0;
  filteredTemas: Tema[] = [];
  pagedTemas: Tema[] = [];

  constructor(
    private temasService: TemasService,
    private fb: FormBuilder,
    private toast: ToastService,
    private log: LoggerService,
    private cdr: ChangeDetectorRef,
    private translate: TranslationService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      activo: ['false', Validators.required],
      esquemaColor: ['', Validators.maxLength(50)],
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

    this.temasService
      .listarSafeSinGlobalLoader()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (list: Tema[]) => {
          this.temas = Array.isArray(list) ? list : [];
          this.totalElements = this.temas.length;
          this.search();
        },
        error: (err) => {
          this.error = 'Error cargando temas';
          this.log.error('temas listar', err);
        },
      });
  }

  openNew(): void {
    this.editItem = null;
    this.form.reset({ nombre: '', activo: 'false', esquemaColor: '' });
    this.modalVisible = true;
  }

  openEdit(item: Tema): void {
    this.editItem = { ...item };
    this.form.reset({
      nombre: item.nombre || '',
      activo: String(item.activo ? 'true' : 'false'),
      esquemaColor: item.esquemaColor || '',
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
    const payload: Tema = {
      nombre: this.form.value.nombre,
      activo: this.form.value.activo === 'true',
      esquemaColor: this.form.value.esquemaColor,
    };
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    const op = this.editItem?.id
      ? this.temasService.actualizarSafe(this.editItem.id, payload, context)
      : this.temasService.crearSafe(payload, context);
    op.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.showSuccess(
          this.isEditing
            ? this.translate.instant('ADMIN.THEMES.SUCCESS.UPDATE')
            : this.translate.instant('ADMIN.THEMES.SUCCESS.CREATE'),
          this.translate.instant('MENU.THEMES')
        );
        this.loading = false;
        this.modalVisible = false;
        this.load();
      },
      error: (err) => {
        this.toast.showError(
          this.isEditing
            ? this.translate.instant('ADMIN.THEMES.ERROR.UPDATE')
            : this.translate.instant('ADMIN.THEMES.ERROR.CREATE'),
          this.translate.instant('MENU.THEMES')
        );
        this.log.error('temas guardar', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  delete(item: Tema): void {
    if (!item.id) return;
    this.itemToDelete = item;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.itemToDelete || !this.itemToDelete.id) return;
    this.loading = true;
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    this.temasService
      .eliminarSafe(this.itemToDelete.id, context)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.showSuccess(
            this.translate.instant('ADMIN.THEMES.SUCCESS.DELETE'),
            this.translate.instant('MENU.THEMES')
          );
          this.loading = false;
          this.showDeleteModal = false;
          this.itemToDelete = null;
          this.load();
        },
        error: (err) => {
          this.toast.showError(
            this.translate.instant('ADMIN.THEMES.ERROR.DELETE'),
            this.translate.instant('MENU.THEMES')
          );
          this.log.error('temas eliminar', err);
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
    const nombre = (this.filtroNombre || '').toLowerCase();
    const activo = this.filtroActivo;
    const base = this.temas || [];
    this.filteredTemas = base.filter((t) => {
      const n = (t.nombre || '').toLowerCase();
      const mBasic = !term || n.includes(term);
      const mNombre = !nombre || n.includes(nombre);
      const mActivo = activo === null || t.activo === activo;
      return mBasic && mNombre && mActivo;
    });
    this.totalElements = this.filteredTemas.length;
    this.pageNo = 0;
    this.updatePage();
  }

  reset(): void {
    this.basicSearchText = '';
    this.filtroNombre = '';
    this.filtroActivo = null;
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
    this.pagedTemas = this.filteredTemas.slice(start, end);
  }
}
