import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { AjustesService } from '../../../../core/services/data/ajustes.service';
import { SystemSetting, SystemSettingType } from '../../../../core/models/system-setting.model';
import { TemasService } from '../../../../core/services/data/temas.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { SKIP_GLOBAL_ERROR_HANDLING } from '../../../../core/interceptor/error.interceptor';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { TranslationService } from '../../../../core/services/translation.service';
import { SKIP_GLOBAL_LOADER } from '../../../../core/interceptor/network.interceptor';
import { ThemeRuntimeService } from '../../../public/services/theme-runtime.service';
import { SearchUtilService } from '../../../../core/services/utils/search-util.service';
import { SearchConditionNode, SearchNode, SearchQuery } from '../../../../shared/models/search.models';
import { PaginaResponse } from '../../../../core/models/pagina-response.model';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.scss'],
  standalone: false,
})
export class AjustesComponent implements OnInit, OnDestroy {
  readonly categoryOptions: ReadonlyArray<{ value: string; label: string }> = [
    { value: 'GENERAL', label: 'GENERAL' },
    { value: 'USUARIOS', label: 'USUARIOS' },
    { value: 'COMENTARIOS', label: 'COMENTARIOS' },
    { value: 'EDITORIAL', label: 'EDITORIAL' },
    { value: 'LISTADOS', label: 'LISTADOS' },
    { value: 'APARIENCIA', label: 'APARIENCIA' },
    { value: 'OPERACION', label: 'OPERACION' },
    { value: 'INTEGRACIONES', label: 'INTEGRACIONES' },
  ];
  readonly typeOptions: ReadonlyArray<{ value: SystemSettingType; label: string }> = [
    { value: 'STRING', label: 'Texto corto' },
    { value: 'TEXT', label: 'Texto largo' },
    { value: 'BOOLEAN', label: 'Booleano' },
    { value: 'INTEGER', label: 'Número entero' },
    { value: 'LONG', label: 'Número largo' },
    { value: 'DECIMAL', label: 'Decimal' },
    { value: 'JSON', label: 'JSON' },
  ];
  readonly triStateOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Sí' },
    { value: 'false', label: 'No' },
  ];

  loading = false;
  error: string | null = null;
  ajustes: SystemSetting[] = [];
  modalVisible = false;
  showDeleteModal = false;
  editItem: SystemSetting | null = null;
  itemToDelete: SystemSetting | null = null;
  form: FormGroup;
  private destroy$ = new Subject<void>();

  get isEditing(): boolean {
    return !!this.editItem;
  }

  get selectedType(): string {
    return this.form.get('tipo')?.value || 'STRING';
  }

  get publicCount(): number {
    return this.ajustes.filter((item) => item.publico).length;
  }

  get restartCount(): number {
    return this.ajustes.filter((item) => item.requiereReinicio).length;
  }

  get nonEditableCount(): number {
    return this.ajustes.filter((item) => item.editable === false).length;
  }

  // Patrón de toolbar/búsqueda/paginación
  basicSearchText = '';
  showAdvanced = false;
  filtroCategoria = '';
  filtroTipo = '';
  filtroClave = '';
  filtroPublico = '';
  filtroEditable = '';
  filtroRequiereReinicio = '';
  pageSize = 20;
  pageNo = 0;
  totalElements = 0;
  filteredAjustes: SystemSetting[] = [];
  pagedAjustes: SystemSetting[] = [];
  categoriasDisponibles: string[] = [];
  tiposDisponibles: string[] = this.typeOptions.map((option) => option.value);

  // Sorting
  currentSortField?: string;
  currentSortDirection?: 'ASC' | 'DESC';

  showResetActiveThemeConfirm = false;

  constructor(
    private ajustesService: AjustesService,
    private temasService: TemasService,
    private themeRuntime: ThemeRuntimeService,
    private fb: FormBuilder,
    private toast: ToastService,
    private log: LoggerService,
    private cdr: ChangeDetectorRef,
    private translate: TranslationService,
    private searchUtil: SearchUtilService
  ) {
    this.form = this.fb.group({
      codigo: ['', [Validators.maxLength(100)]],
      categoria: ['', [Validators.required, Validators.maxLength(100)]],
      clave: ['', [Validators.required, Validators.maxLength(150)]],
      valor: [''],
      descripcion: ['', [Validators.maxLength(255)]],
      orden: [0],
      tipo: ['STRING', [Validators.required]],
      editable: [true],
      visible: [true],
      publico: [false],
      requiereReinicio: [false],
      valorPorDefecto: [''],
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
    this.error = null;
    this.hydrateFilterOptions();
    this.search();
  }

  askResetActiveTheme(): void {
    this.showResetActiveThemeConfirm = true;
    this.cdr.detectChanges();
  }

  confirmResetActiveTheme(): void {
    this.showResetActiveThemeConfirm = false;
    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.temasService
      .resetActiveTheme(ctx)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.showSuccess(
            this.translate.instant('ADMIN.THEMES.ACTIVE.RESET_SUCCESS'),
            this.translate.instant('MENU.SETTINGS')
          );
          this.themeRuntime.refreshActive().subscribe();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.log.error('reset theme', err);
          this.toast.showError(
            this.translate.instant('ADMIN.THEMES.ACTIVE.RESET_ERROR'),
            this.translate.instant('MENU.SETTINGS')
          );
          this.cdr.detectChanges();
        },
      });
  }

  openNew(): void {
    this.editItem = null;
    this.form.reset(this.createDefaultFormValue());
    this.modalVisible = true;
  }

  openEdit(item: SystemSetting): void {
    this.editItem = { ...item };
    this.form.reset({
      codigo: item.codigo || '',
      categoria: item.categoria || '',
      clave: item.clave || '',
      valor: item.valor || '',
      descripcion: item.descripcion || '',
      orden: item.orden ?? 0,
      tipo: this.normalizeType(item.tipo),
      editable: item.editable ?? true,
      visible: item.visible ?? true,
      publico: item.publico ?? false,
      requiereReinicio: item.requiereReinicio ?? false,
      valorPorDefecto: item.valorPorDefecto || '',
    });
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible = false;
    this.editItem = null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload: SystemSetting = this.normalizePayload(this.form.getRawValue());
    const validationError = this.validatePayload(payload);
    if (validationError) {
      this.toast.showError(validationError, this.translate.instant('MENU.SETTINGS'));
      return;
    }
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    const originalKey = this.editItem?.clave;
    const op = originalKey
      ? this.ajustesService.actualizar(originalKey, payload, context)
      : this.ajustesService.crear(payload, context);

    op.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (!this.isSuccessfulResponse(response)) {
          this.handleSaveError(response);
          return;
        }

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

  delete(item: SystemSetting): void {
    if (!item.clave) return;
    this.itemToDelete = item;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.itemToDelete?.clave) return;
    this.loading = true;
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    this.ajustesService.borrar(this.itemToDelete.clave, context).subscribe({
      next: (response) => {
        if (!this.isSuccessfulResponse(response)) {
          this.handleDeleteError(response);
          return;
        }

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
    if (!this.showAdvanced) {
      this.resetAdvancedFilters();
    }
  }

  onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text || '';
    this.pageNo = 0;
    this.search();
  }

  onFilterChange(): void {
    this.pageNo = 0;
    this.search();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size) || 20;
    this.pageNo = 0;
    this.search();
  }

  search(): void {
    this.loading = true;
    this.error = null;
    const searchRequest = this.buildSearchRequest();

    this.ajustesService
      .buscarPaginaAjustesSafe(
        searchRequest,
        this.pageNo,
        this.pageSize,
        this.currentSortField,
        this.currentSortDirection
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data: PaginaResponse) => {
          this.setPageData(data);
        },
        error: (err) => {
          this.error = this.translate.instant('ADMIN.SETTINGS.ERROR.LOAD');
          this.log.error('ajustes buscar', err);
        },
      });
  }

  clearBasicSearch(): void {
    if (!this.basicSearchText) {
      return;
    }
    this.basicSearchText = '';
    this.pageNo = 0;
    this.search();
  }

  ordenar(field: string, direction: 'ASC' | 'DESC') {
    this.currentSortField = field;
    this.currentSortDirection = direction;
    this.pageNo = 0;
    this.search();
  }

  getSortIcon(field: string): string {
    if (this.currentSortField !== field) return 'cilSortAlphaDown';
    return this.currentSortDirection === 'ASC' ? 'cilSortAlphaDown' : 'cilSortAlphaUp';
  }

  isSortActive(field: string, direction: 'ASC' | 'DESC'): boolean {
    return this.currentSortField === field && this.currentSortDirection === direction;
  }

  reset(): void {
    this.basicSearchText = '';
    this.resetAdvancedFilters(false);
    this.pageNo = 0;
    this.search();
  }

  onPageChange(page: number): void {
    const totalPages = this.getTotalPages();
    const safePage = Math.max(0, Math.min(Number(page) || 0, Math.max(0, totalPages - 1)));
    if (safePage === this.pageNo) return;
    this.pageNo = safePage;
    this.search();
  }

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.pageSize));
  }

  private updatePage(): void {
    this.pagedAjustes = Array.isArray(this.ajustes) ? this.ajustes : [];
  }

  trackByAjuste(index: number, a: SystemSetting): number | string {
    return a?.clave || a?.id || `${a?.categoria || ''}-${index}`;
  }

  getTipoLabel(tipo?: string): string {
    const normalized = this.normalizeType(tipo);
    return this.typeOptions.find((option) => option.value === normalized)?.label || normalized;
  }

  getValorResumen(item: SystemSetting): string {
    const value = item.valor?.trim();
    const fallback = item.valorPorDefecto?.trim();
    return value || fallback || '—';
  }

  getBooleanLabel(value?: boolean): string {
    return value ? 'Sí' : 'No';
  }

  getBooleanBadgeColor(value?: boolean, falseColor: string = 'secondary'): string {
    return value ? 'success' : falseColor;
  }

  usesBooleanInput(): boolean {
    return this.selectedType === 'BOOLEAN';
  }

  usesLongTextInput(): boolean {
    return this.selectedType === 'TEXT' || this.selectedType === 'JSON';
  }

  usesNumericInput(): boolean {
    return ['INTEGER', 'LONG', 'DECIMAL'].includes(this.selectedType);
  }

  getValueStep(): string {
    return this.selectedType === 'DECIMAL' ? '0.01' : '1';
  }

  private createDefaultFormValue(): Record<string, unknown> {
    return {
      codigo: '',
      categoria: 'GENERAL',
      clave: '',
      valor: '',
      descripcion: '',
      orden: 0,
      tipo: 'STRING',
      editable: true,
      visible: true,
      publico: false,
      requiereReinicio: false,
      valorPorDefecto: '',
    };
  }

  private hydrateFilterOptions(): void {
    this.categoriasDisponibles = [...this.categoryOptions.map((option) => option.value)].sort((left, right) =>
      left.localeCompare(right)
    );

    const dynamicTypes = this.ajustes
      .map((item) => this.normalizeType(item.tipo))
      .filter((value): value is string => !!value);

    this.tiposDisponibles = [...new Set([...this.typeOptions.map((option) => option.value), ...dynamicTypes])];
  }

  private normalizePayload(rawValue: Record<string, unknown>): SystemSetting {
    return {
      codigo: this.normalizeNullableString(rawValue['codigo']),
      categoria: this.normalizeCategory(rawValue['categoria']),
      clave: this.cleanString(rawValue['clave']),
      valor: this.normalizeNullableString(rawValue['valor']),
      descripcion: this.normalizeNullableString(rawValue['descripcion']),
      orden: this.normalizeNumber(rawValue['orden']),
      tipo: this.normalizeType(rawValue['tipo']),
      editable: !!rawValue['editable'],
      visible: !!rawValue['visible'],
      publico: !!rawValue['publico'],
      requiereReinicio: !!rawValue['requiereReinicio'],
      valorPorDefecto: this.normalizeNullableString(rawValue['valorPorDefecto']),
    };
  }

  private normalizeCategory(value: unknown): string {
    const normalized = String(value || 'GENERAL').trim().toUpperCase();
    return this.categoryOptions.some((option) => option.value === normalized) ? normalized : normalized;
  }

  private normalizeType(tipo: unknown): SystemSettingType | string {
    const normalized = String(tipo || 'STRING').toUpperCase();
    return this.typeOptions.some((option) => option.value === normalized as SystemSettingType)
      ? (normalized as SystemSettingType)
      : normalized;
  }

  private cleanString(value: unknown): string {
    return String(value || '').trim();
  }

  private normalizeNullableString(value: unknown): string | undefined {
    const normalized = String(value ?? '').trim();
    return normalized ? normalized : undefined;
  }

  private normalizeNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : undefined;
  }

  private resetAdvancedFilters(runSearch: boolean = true): void {
    this.filtroCategoria = '';
    this.filtroTipo = '';
    this.filtroClave = '';
    this.filtroPublico = '';
    this.filtroEditable = '';
    this.filtroRequiereReinicio = '';
    if (runSearch) {
      this.pageNo = 0;
      this.search();
    }
  }

  private validatePayload(payload: SystemSetting): string | null {
    if (!payload.categoria || !this.categoryOptions.some((option) => option.value === payload.categoria)) {
      return this.translate.instant('ADMIN.SETTINGS.ERROR.INVALID_CATEGORY');
    }

    if (payload.tipo === 'JSON') {
      const invalidJsonMessage = this.translate.instant('COMMON.INVALID_JSON');
      if (payload.valor && !this.isValidJson(payload.valor)) {
        return invalidJsonMessage;
      }
      if (payload.valorPorDefecto && !this.isValidJson(payload.valorPorDefecto)) {
        return invalidJsonMessage;
      }
    }

    return null;
  }

  private isValidJson(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  private matchesBooleanFilter(value: boolean | undefined, filterValue: string): boolean {
    if (!filterValue) {
      return true;
    }

    return String(!!value) === filterValue;
  }

  private buildSearchRequest(): SearchQuery {
    const nodes: SearchNode[] = [];
    const term = this.basicSearchText.trim();

    if (term) {
      const basicChildren = [
        this.searchUtil.buildCondition('clave', 'contains', term),
        this.searchUtil.buildCondition('codigo', 'contains', term),
        this.searchUtil.buildCondition('descripcion', 'contains', term),
        this.searchUtil.buildCondition('valor', 'contains', term),
      ].filter((node): node is SearchConditionNode => !!node);

      if (basicChildren.length > 0) {
        nodes.push(this.searchUtil.buildGroup('OR', basicChildren));
      }
    }

    if (this.filtroCategoria) {
      nodes.push(this.searchUtil.buildCondition('categoria', 'equal', this.filtroCategoria)!);
    }
    if (this.filtroTipo) {
      nodes.push(this.searchUtil.buildCondition('tipo', 'equal', this.filtroTipo)!);
    }
    if (this.filtroClave) {
      nodes.push(this.searchUtil.buildCondition('clave', 'contains', this.filtroClave)!);
    }
    if (this.filtroPublico) {
      nodes.push(this.searchUtil.buildCondition('publico', 'equal', this.filtroPublico === 'true')!);
    }
    if (this.filtroEditable) {
      nodes.push(this.searchUtil.buildCondition('editable', 'equal', this.filtroEditable === 'true')!);
    }
    if (this.filtroRequiereReinicio) {
      nodes.push(
        this.searchUtil.buildCondition(
          'requiereReinicio',
          'equal',
          this.filtroRequiereReinicio === 'true'
        )!
      );
    }

    if (nodes.length === 0) {
      return this.searchUtil.buildSingle('SystemSetting', 'clave', '', 'CONTAINS');
    }

    if (nodes.length === 1) {
      return { node: nodes[0] };
    }

    return { node: this.searchUtil.buildGroup('AND', nodes) };
  }

  private setPageData(data: PaginaResponse): void {
    const raw = (data?.elements ?? (data as any)?.items ?? (data as any)?.content ?? []) as SystemSetting[];
    this.ajustes = Array.isArray(raw) ? raw : [];
    this.filteredAjustes = this.ajustes;
    this.pagedAjustes = this.ajustes;
    this.totalElements = Number(data?.totalElements ?? this.ajustes.length) || 0;
  }

  private isSuccessfulResponse(response: any): boolean {
    return response?.result?.success === true;
  }

  private handleSaveError(error: unknown): void {
    this.toast.showError(
      this.isEditing
        ? this.translate.instant('ADMIN.SETTINGS.ERROR.UPDATE')
        : this.translate.instant('ADMIN.SETTINGS.ERROR.CREATE'),
      this.translate.instant('MENU.SETTINGS')
    );
    this.log.error('ajustes guardar', error);
    this.loading = false;
    this.cdr.detectChanges();
  }

  private handleDeleteError(error: unknown): void {
    this.toast.showError(
      this.translate.instant('ADMIN.SETTINGS.ERROR.DELETE'),
      this.translate.instant('MENU.SETTINGS')
    );
    this.log.error('ajustes eliminar', error);
    this.loading = false;
    this.cdr.detectChanges();
  }
}
