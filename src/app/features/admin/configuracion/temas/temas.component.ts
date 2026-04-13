import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { TemasService } from '../../../../core/services/data/temas.service';
import { Tema, TemaDraft } from '../../../../core/models/tema.model';
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

  // Draft modal
  draftModalVisible = false;
  draftLoading = false;
  draftTema: Tema | null = null;
  draftData: TemaDraft | null = null;
  draftTokensJson = '';
  draftMetadataJson = '';
  draftAllowTokensEdit = false;
  showConvertDraftModal = false;

  // Manage modal (detalle + acciones)
  manageModalVisible = false;
  manageTema: Tema | null = null;
  private manageAllowClose = false;

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

    // El "código" (slug) debe almacenarse en minúsculas (backend lo exige),
    // pero mostrarse en mayúsculas en la UI (text-uppercase en template).
    this.form
      .get('slug')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((v: any) => {
        if (v == null) return;
        const normalized = String(v)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        if (normalized !== v) {
          this.form.get('slug')?.setValue(normalized, { emitEvent: false });
        }
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
    this.form.get('slug')?.enable({ emitEvent: false });
    this.modalVisible = true;
  }

  openEdit(item: Tema): void {
    this.editItem = { ...item };
    this.form.reset({
      nombre: item.nombre || '',
      slug: item.slug || '',
      descripcion: item.descripcion || '',
    });
    // El slug no se puede modificar una vez creado.
    this.form.get('slug')?.disable({ emitEvent: false });
    this.modalVisible = true;
  }

  closeModal(): void {
    this.onModalVisibleChange(false);
  }

  onModalVisibleChange(visible: boolean): void {
    this.modalVisible = visible;
    if (!visible) {
      this.editItem = null;
    }
    this.cdr.detectChanges();
  }

  save(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const payload: Partial<Tema> = {
      nombre: this.form.value.nombre,
      descripcion: (this.form.value.descripcion || '').trim() || undefined,
    };
    // Solo permitir slug en creación; en edición debe ser inmutable.
    if (!this.isEditing) {
      payload.slug = (this.form.get('slug')?.value || '').trim() || undefined;
    }
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
  openManage(t: Tema): void {
    this.manageTema = t;
    this.manageModalVisible = true;
    this.cdr.detectChanges();
  }

  closeManageModal(): void {
    this.manageAllowClose = true;
    this.manageModalVisible = false;
    this.cdr.detectChanges();
  }

  onManageModalVisibleChange(visible: boolean): void {
    // UX: no cerrar por click fuera / ESC. Solo cerrar con botón X/Cancelar.
    // CoreUI emite visibleChange al inicializar (false). No debemos forzar apertura ahí.
    const wasOpen = this.manageModalVisible === true;
    if (wasOpen && !visible && !this.manageAllowClose) {
      this.manageModalVisible = true;
      this.cdr.detectChanges();
      return;
    }
    if (!visible) {
      this.manageAllowClose = false;
      this.manageTema = null;
    }
  }

  // Acciones desde el modal de gestionar (evitar referencias null en template)
  onManageDraft(): void {
    const t = this.manageTema;
    if (!t) return;
    // Evitar stacking de modales (Gestionar + Borrador)
    this.closeManageModal();
    this.openDraft(t);
  }

  onManagePreview(): void {
    const t = this.manageTema;
    if (!t) return;
    this.preview(t);
  }

  onManagePublish(): void {
    const t = this.manageTema;
    if (!t) return;
    this.publish(t);
  }

  onManageActivate(): void {
    const t = this.manageTema;
    if (!t) return;
    this.activate(t);
  }

  onManageEdit(): void {
    const t = this.manageTema;
    if (!t) return;
    this.openEdit(t);
    this.closeManageModal();
  }

  onManageDelete(): void {
    const t = this.manageTema;
    if (!t) return;
    this.delete(t);
    this.closeManageModal();
  }

  openDraft(t: Tema): void {
    if (!t?.slug) return;

    this.draftTema = t;
    this.draftData = null;
    this.draftTokensJson = '';
    this.draftMetadataJson = '';
    this.draftAllowTokensEdit = false;
    this.draftModalVisible = true;
    this.draftLoading = true;

    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.temasService
      .getDraft(t.slug, context)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.draftLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (d) => {
          // d === null => no existe borrador aún (backend devuelve data=null)
          if (!d) {
            this.draftData = null;
            this.draftAllowTokensEdit = true;
            this.draftTokensJson = '{\n\n}';
            this.draftMetadataJson = '';
            this.toast.showInfo(
              this.translate.instant('ADMIN.THEMES.DRAFT.NO_DRAFT'),
              this.translate.instant('MENU.THEMES')
            );
            return;
          }
          this.draftData = d;
          this.draftAllowTokensEdit = (d?.sourceType || '').toString() !== 'CSS_PACKAGE';
          this.draftTokensJson = d?.tokensJson || '{\n\n}';
          this.draftMetadataJson = d?.metadataJson || '';
        },
        error: (err) => {
          // Si no existe borrador todavía, permitimos crearlo pegando tokens.
          this.draftAllowTokensEdit = true;
          this.draftTokensJson = '{\n\n}';
          this.draftMetadataJson = '';
          this.toast.showInfo(
            this.translate.instant('ADMIN.THEMES.DRAFT.NO_DRAFT'),
            this.translate.instant('MENU.THEMES')
          );
          this.log.error('temas draft get', err);
        },
      });
  }

  closeDraftModal(): void {
    this.closeDraftModalInternal(true);
  }

  onDraftModalVisibleChange(visible: boolean): void {
    this.draftModalVisible = visible;
    if (!visible) {
      this.closeDraftModalInternal(false);
    }
    this.cdr.detectChanges();
  }

  private closeDraftModalInternal(setVisible: boolean): void {
    if (setVisible) this.draftModalVisible = false;
    this.draftTema = null;
    this.draftData = null;
    this.draftTokensJson = '';
    this.draftMetadataJson = '';
    this.draftAllowTokensEdit = false;
    this.showConvertDraftModal = false;
  }

  askConvertDraftToTokens(): void {
    this.showConvertDraftModal = true;
  }

  confirmConvertDraftToTokens(): void {
    this.showConvertDraftModal = false;
    this.draftAllowTokensEdit = true;
    if (!this.draftTokensJson || !this.draftTokensJson.trim()) {
      this.draftTokensJson = '{\n  \"--op-primary\": \"#0d6efd\"\n}';
    }
    this.cdr.detectChanges();
  }

  saveDraft(): void {
    if (!this.draftTema?.slug) return;
    if (!this.draftAllowTokensEdit) return;

    // Validación mínima de JSON
    try {
      JSON.parse(this.draftTokensJson || '{}');
      if (this.draftMetadataJson) JSON.parse(this.draftMetadataJson);
    } catch (e) {
      this.toast.showError(this.translate.instant('COMMON.ERROR'), this.translate.instant('MENU.THEMES'));
      return;
    }

    this.draftLoading = true;
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.temasService
      .upsertDraft(
        this.draftTema.slug,
        { tokensJson: this.draftTokensJson, metadataJson: this.draftMetadataJson || undefined },
        context
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.draftLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeDraftModal();
          this.obtenerListaTemas();
        },
        error: (err) => {
          this.toast.showError(this.translate.instant('COMMON.ERROR'), this.translate.instant('MENU.THEMES'));
          this.log.error('temas draft save', err);
        },
      });
  }

  preview(t: Tema): void {
    if (!t?.slug) return;
    if (!t.draft && !t.published) {
      this.toast.showWarning(
        this.translate.instant('ADMIN.THEMES.PREVIEW_NO_VERSION'),
        this.translate.instant('MENU.THEMES')
      );
      return;
    }
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
      .listarPaginaTemasSinGlobalLoader(this.pageNo, this.pageSize, sortBy, sortDir)
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
