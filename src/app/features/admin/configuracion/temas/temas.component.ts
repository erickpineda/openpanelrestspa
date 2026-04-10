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
import { SKIP_GLOBAL_LOADER } from '../../../../core/interceptor/network.interceptor';

@Component({
  selector: 'app-temas',
  templateUrl: './temas.component.html',
  styleUrls: ['./temas.component.scss'],
  standalone: false,
})
export class TemasComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  temas: Tema[] = []; // página actual (server paging)
  viewTemas: Tema[] = []; // filtro client-side sobre la página actual
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
  pageSize: number = 10;
  pageNo: number = 0;
  totalElements: number = 0;
  totalPages: number = 1;
  numberOfElements: number = 0;

  // Sorting
  currentSortField?: string;
  currentSortDirection?: 'ASC' | 'DESC';

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
      slug: ['', Validators.maxLength(100)],
      descripcion: ['', Validators.maxLength(255)],
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
    this.pageNo = 0;
    this.obtenerListaTemas();
  }

  openNew(): void {
    this.editItem = null;
    this.form.reset({ nombre: '', slug: '', descripcion: '' });
    this.modalVisible = true;
  }

  openEdit(item: Tema): void {
    this.editItem = { ...item };
    this.form.reset({
      nombre: item.nombre || '',
      slug: item.slug || '',
      descripcion: item.descripcion || '',
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
    const payload: Partial<Tema> = {
      nombre: this.form.value.nombre,
      slug: (this.form.value.slug || '').trim() || undefined,
      descripcion: (this.form.value.descripcion || '').trim() || undefined,
    };
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    const op = this.editItem?.slug
      ? this.temasService.actualizarPorSlug(this.editItem.slug, payload, context)
      : this.temasService.crearTema(payload, context);
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
        this.obtenerListaTemas();
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
    if (!item.slug) return;
    this.itemToDelete = item;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.itemToDelete || !this.itemToDelete.slug) return;
    this.loading = true;
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    this.temasService
      .borrarPorSlug(this.itemToDelete.slug, context)
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
          this.obtenerListaTemas();
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
    this.search();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size) || 10;
    this.pageNo = 0;
    this.obtenerListaTemas();
  }

  search(): void {
    const term = (this.basicSearchText || '').trim().toLowerCase();
    if (!term) {
      this.viewTemas = [...this.temas];
      return;
    }
    // Filtro client-side sobre la página actual (MVP). No altera la paginación del servidor.
    this.viewTemas = (this.temas || []).filter((t) => {
      const n = (t.nombre || '').toLowerCase();
      const s = (t.slug || '').toLowerCase();
      return n.includes(term) || s.includes(term);
    });
  }

  reset(): void {
    this.basicSearchText = '';
    this.search();
  }

  onPageChange(page: number): void {
    const safePage = Math.max(0, Math.min(Number(page) || 0, Math.max(0, this.totalPages - 1)));
    if (safePage === this.pageNo) return;
    this.pageNo = safePage;
    this.obtenerListaTemas();
  }

  ordenar(field: string, direction: 'ASC' | 'DESC'): void {
    if (this.currentSortField !== field || this.currentSortDirection !== direction) {
      this.currentSortField = field;
      this.currentSortDirection = direction;
      this.pageNo = 0;
      this.obtenerListaTemas();
    }
  }

  getSortIcon(): string {
    if (!this.currentSortField) return 'cilSortAlphaDown';
    return this.currentSortDirection === 'ASC' ? 'cilSortAlphaUp' : 'cilSortAlphaDown';
  }

  isSortActive(field: string, direction: 'ASC' | 'DESC'): boolean {
    return this.currentSortField === field && this.currentSortDirection === direction;
  }

  // ===== Acciones =====
  preview(t: Tema): void {
    if (!t?.slug) return;
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.temasService.createPreviewToken(t.slug, context).pipe(takeUntil(this.destroy$)).subscribe({
      next: (resp) => {
        const url = resp?.previewUrl || '';
        const finalUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
        if (finalUrl) window.open(finalUrl, '_blank');
      },
      error: (err) => {
        this.toast.showError(this.translate.instant('COMMON.ERROR'), this.translate.instant('MENU.THEMES'));
        this.log.error('temas preview', err);
      },
    });
  }

  publish(t: Tema): void {
    if (!t?.slug) return;
    this.loading = true;
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.temasService.publish(t.slug, context).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loading = false;
        this.obtenerListaTemas();
      },
      error: (err) => {
        this.loading = false;
        this.toast.showError(this.translate.instant('COMMON.ERROR'), this.translate.instant('MENU.THEMES'));
        this.log.error('temas publish', err);
        this.cdr.detectChanges();
      },
    });
  }

  activate(t: Tema): void {
    if (!t?.slug) return;
    this.loading = true;
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.temasService.activate(t.slug, undefined, context).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loading = false;
        this.obtenerListaTemas();
      },
      error: (err) => {
        this.loading = false;
        this.toast.showError(this.translate.instant('COMMON.ERROR'), this.translate.instant('MENU.THEMES'));
        this.log.error('temas activate', err);
        this.cdr.detectChanges();
      },
    });
  }

  onUploadDraftZip(t: Tema, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input?.files && input.files.length ? input.files[0] : null;
    if (!t?.slug || !file) return;

    this.loading = true;
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.temasService.uploadDraftPackage(t.slug, file, context).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loading = false;
        input.value = '';
        this.obtenerListaTemas();
      },
      error: (err) => {
        this.loading = false;
        input.value = '';
        this.toast.showError(this.translate.instant('COMMON.ERROR'), this.translate.instant('MENU.THEMES'));
        this.log.error('temas upload', err);
        this.cdr.detectChanges();
      },
    });
  }

  private obtenerListaTemas(): void {
    this.loading = true;
    this.error = null;

    const sortBy = this.currentSortField || 'idTema';
    const sortDir = this.currentSortDirection || 'DESC';

    this.temasService
      .listarPaginaSinGlobalLoader(this.pageNo, this.pageSize, sortBy, sortDir)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data: any) => this.setPageData(data),
        error: (err) => {
          this.error = 'Error cargando temas';
          this.log.error('temas listar', err);
        },
      });
  }

  private setPageData(data: any): void {
    const raw = data?.elements ?? (Array.isArray(data) ? data : []);
    const elementos: Tema[] = Array.isArray(raw) ? raw : [];
    this.temas = elementos;
    this.viewTemas = [...elementos];

    this.totalElements = Number(data?.totalElements ?? elementos.length ?? 0);
    this.totalPages = Number(data?.totalPages ?? 1);
    this.numberOfElements = Number(data?.numberOfElements ?? elementos.length ?? 0);

    if (this.temas.length === 0 && this.pageNo > 0 && this.pageNo >= this.totalPages) {
      this.pageNo = Math.max(0, this.totalPages - 1);
      this.obtenerListaTemas();
      return;
    }

    this.search();
  }
}
