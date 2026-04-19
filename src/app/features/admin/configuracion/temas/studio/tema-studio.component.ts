import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpContext } from '@angular/common/http';
import { Subject, forkJoin } from 'rxjs';
import { finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { TemasService } from '@app/core/services/data/temas.service';
import { Tema } from '@app/core/models/tema.model';
import { TemaPreset } from '@app/core/models/tema-preset.model';
import { TemaVersion } from '@app/core/models/tema-version.model';
import { TemaVersionCompare } from '@app/core/models/tema-version-compare.model';
import { TemaPresetsService } from '@app/core/services/data/tema-presets.service';
import { PublicThemesService } from '@app/core/services/data/public-themes.service';
import { ThemeRuntimeService } from '@app/features/public/services/theme-runtime.service';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { ToastService } from '@app/core/services/ui/toast.service';
import { TranslationService } from '@app/core/services/translation.service';
import { LoggerService } from '@app/core/services/logger.service';
import { SKIP_GLOBAL_ERROR_HANDLING } from '@app/core/interceptor/error.interceptor';
import { SKIP_GLOBAL_LOADER } from '@app/core/interceptor/network.interceptor';

type StudioSection = 'overview' | 'simple' | 'draft' | 'versions' | 'preview' | 'settings';
type StudioMode = 'simple' | 'advanced';

@Component({
  selector: 'app-tema-studio',
  templateUrl: './tema-studio.component.html',
  styleUrls: ['./tema-studio.component.scss'],
  standalone: false,
})
export class TemaStudioComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  slug = '';
  tema: Tema | null = null;

  // Estado tema activo público
  activePublicThemeSlug: string | null = null;
  activePublicThemeVersion: number | null = null;
  activePublicThemeVersionId: number | null = null;

  // UI state
  mode: StudioMode = 'simple';
  section: StudioSection = 'overview';

  // Cargas
  loading = false;
  savingDraft = false;
  versionsLoading = false;
  presetsLoading = false;

  // Presets
  presets: TemaPreset[] = [];
  applyPresetId: number | null = null;
  applyPresetMode: 'replace' | 'merge' = 'replace';

  // Simple mode form (6 tokens recomendados)
  simpleForm: FormGroup;
  private simpleTokenKeys = [
    '--cui-primary',
    '--cui-primary-rgb',
    '--cui-body-bg',
    '--cui-body-color',
    '--cui-border-color',
    '--cui-secondary-color',
  ] as const;

  // Draft (Avanzado)
  draftTokensJson = '{\n\n}';
  draftMetadataJson = '';
  draftEditorMode: 'json' | 'table' = 'json';
  draftTokenRows: Array<{ key: string; value: string }> = [{ key: '', value: '' }];

  // Versiones
  publishedVersions: TemaVersion[] = [];
  versionCompareFrom: number | null = null;
  versionCompareTo: number | null = null;
  versionCompareResult: TemaVersionCompare | null = null;
  editingReleaseNotesVersion: number | null = null;
  editingReleaseNotesText = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private temasService: TemasService,
    private presetsService: TemaPresetsService,
    private publicThemes: PublicThemesService,
    private themeRuntime: ThemeRuntimeService,
    private tokenStorage: TokenStorageService,
    private toast: ToastService,
    private translate: TranslationService,
    private log: LoggerService,
    private cdr: ChangeDetectorRef
  ) {
    this.simpleForm = this.fb.group({
      '--cui-primary': ['#0ea5e9', [Validators.required]],
      '--cui-primary-rgb': ['14,165,233', [Validators.required]],
      '--cui-body-bg': ['#ffffff', [Validators.required]],
      '--cui-body-color': ['#0b1220', [Validators.required]],
      '--cui-border-color': ['rgba(11,18,32,0.22)', [Validators.required]],
      '--cui-secondary-color': ['rgba(11,18,32,0.78)', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.slug = (this.route.snapshot.paramMap.get('slug') || '').trim();
    if (!this.slug) {
      this.router.navigate(['/admin/configuracion/temas']);
      return;
    }
    this.section = (this.route.snapshot.queryParamMap.get('tab') as StudioSection) || 'overview';
    this.loadModeFromStorage();
    this.loadAll();

    // Re-aplicar preview local cuando cambien controles del modo simple
    this.simpleForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.applySimpleTokensToRuntime();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================
  // Persistencia modo (por usuario+tema)
  // =========================

  private getUserKey(): string {
    const u = this.tokenStorage.getUser();
    const id = u?.idUsuario ?? u?.id ?? u?.username ?? u?.usuario ?? u?.email ?? 'anon';
    return String(id);
  }

  private getModeStorageKey(): string {
    return `op_admin_theme_studio_mode::${this.getUserKey()}::${this.slug}`;
  }

  private loadModeFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.getModeStorageKey());
      if (raw === 'advanced' || raw === 'simple') {
        this.mode = raw;
      }
    } catch {
      // ignore
    }
  }

  setMode(mode: StudioMode): void {
    this.mode = mode;
    try {
      localStorage.setItem(this.getModeStorageKey(), mode);
    } catch {
      // ignore
    }
    this.cdr.detectChanges();
  }

  // =========================
  // Carga base
  // =========================

  loadAll(): void {
    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.loading = true;
    this.versionsLoading = true;
    this.presetsLoading = true;

    forkJoin({
      tema: this.temasService.obtenerPorSlug(this.slug, ctx),
      draft: this.temasService.getDraft(this.slug, ctx),
      versions: this.temasService.listVersions(this.slug, 'PUBLISHED', ctx),
      presets: this.presetsService.listar(ctx),
      active: this.publicThemes.getActive(true),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.versionsLoading = false;
          this.presetsLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({ tema, draft, versions, presets, active }: any) => {
          this.tema = tema || null;
          this.publishedVersions = versions || [];
          this.presets = presets || [];
          this.activePublicThemeSlug = active?.slug ?? null;
          this.activePublicThemeVersion = active?.version ?? null;
          this.activePublicThemeVersionId = active?.idTemaVersion ?? null;

          // Draft local (si no hay borrador, empezar vacío)
          this.draftTokensJson = draft?.tokensJson || '{\n\n}';
          this.draftMetadataJson = draft?.metadataJson || '';
          this.draftTokenRows = this.buildTokenRowsFromJson(this.draftTokensJson);

          // Sincronizar valores del modo simple
          this.fillSimpleFormFromDraftTokens();
          this.applySimpleTokensToRuntime();
        },
        error: (err) => {
          this.log.error('TemaStudio loadAll', err);
          this.toast.showError(this.translate.instant('COMMON.ERROR'), this.translate.instant('MENU.THEMES'));
        },
      });
  }

  // =========================
  // Navegación interna
  // =========================

  setSection(section: StudioSection): void {
    this.section = section;
    // Mantener URL compartible (tab)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: section },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // =========================
  // Estado activo / utilidades
  // =========================

  isThemeActive(): boolean {
    return !!this.tema?.slug && this.activePublicThemeSlug === this.tema.slug;
  }

  isActiveVersion(v: TemaVersion): boolean {
    return this.isThemeActive() && (this.activePublicThemeVersion ?? null) === (v?.version ?? null);
  }

  canRollback(): boolean {
    const versions = this.publishedVersions || [];
    if (!this.tema?.slug) return false;
    if (!this.isThemeActive()) return false; // UX: rollback sólo si está activo
    if (versions.length < 2) return false;
    if (this.activePublicThemeVersion == null) return false;
    return versions.some((x) => (x?.version ?? 0) < (this.activePublicThemeVersion as number));
  }

  private refreshActiveAndRuntime(ctx: HttpContext) {
    return this.publicThemes.getActive(true).pipe(
      tap((t: any) => {
        this.activePublicThemeSlug = t?.slug ?? null;
        this.activePublicThemeVersion = t?.version ?? null;
        this.activePublicThemeVersionId = t?.idTemaVersion ?? null;
      }),
      switchMap(() => this.themeRuntime.refreshActive()),
      map(() => void 0)
    );
  }

  private extractApiErrorMessage(err: any): string {
    const details: string[] = err?.error?.error?.details || err?.error?.details || [];
    if (Array.isArray(details) && details.length) return details.join(' · ');
    const msg =
      err?.error?.error?.message ||
      err?.error?.message ||
      err?.message ||
      this.translate.instant('COMMON.ERROR');
    return String(msg);
  }

  // =========================
  // Acciones topbar
  // =========================

  doPublish(): void {
    if (!this.tema?.slug) return;
    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.loading = true;
    this.temasService
      .publish(this.tema.slug, ctx)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.loadAllAndKeepTab(ctx)),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () =>
          this.toast.showSuccess(
            this.translate.instant('ADMIN.THEMES.STUDIO.ACTIONS.PUBLISH_OK'),
            this.translate.instant('MENU.THEMES')
          ),
        error: (err) => this.toast.showError(this.extractApiErrorMessage(err), this.translate.instant('MENU.THEMES')),
      });
  }

  doActivateLatest(): void {
    if (!this.tema?.slug) return;
    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.loading = true;
    this.temasService
      .activate(this.tema.slug, undefined, ctx)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.refreshActiveAndRuntime(ctx)),
        switchMap(() => this.loadAllAndKeepTab(ctx)),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => this.toast.showSuccess(this.translate.instant('ADMIN.THEMES.VERSIONS.ACTIVATED'), this.translate.instant('MENU.THEMES')),
        error: (err) => this.toast.showError(this.extractApiErrorMessage(err), this.translate.instant('MENU.THEMES')),
      });
  }

  doDeactivateToDefault(): void {
    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.loading = true;
    this.temasService
      .resetActiveTheme(ctx)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.refreshActiveAndRuntime(ctx)),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () =>
          this.toast.showSuccess(this.translate.instant('ADMIN.THEMES.ACTIVE.RESET_SUCCESS'), this.translate.instant('MENU.THEMES')),
        error: (err) => this.toast.showError(this.extractApiErrorMessage(err), this.translate.instant('MENU.THEMES')),
      });
  }

  doRollback(): void {
    if (!this.tema?.slug || !this.canRollback()) {
      this.toast.showInfo(this.translate.instant('ADMIN.THEMES.VERSIONS.ROLLBACK_NOT_AVAILABLE'), this.translate.instant('MENU.THEMES'));
      return;
    }
    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.loading = true;
    this.temasService
      .rollback(this.tema.slug, ctx)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.refreshActiveAndRuntime(ctx)),
        switchMap(() => this.loadAllAndKeepTab(ctx)),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => this.toast.showSuccess(this.translate.instant('ADMIN.THEMES.VERSIONS.ROLLBACK_OK'), this.translate.instant('MENU.THEMES')),
        error: (err) => this.toast.showError(this.extractApiErrorMessage(err), this.translate.instant('MENU.THEMES')),
      });
  }

  private loadAllAndKeepTab(ctx: HttpContext) {
    // Recarga tema + versiones sin tocar sección
    return forkJoin({
      tema: this.temasService.obtenerPorSlug(this.slug, ctx),
      versions: this.temasService.listVersions(this.slug, 'PUBLISHED', ctx),
      draft: this.temasService.getDraft(this.slug, ctx),
    }).pipe(
      tap(({ tema, versions, draft }: any) => {
        this.tema = tema || null;
        this.publishedVersions = versions || [];
        this.draftTokensJson = draft?.tokensJson || this.draftTokensJson;
        this.draftMetadataJson = draft?.metadataJson || this.draftMetadataJson;
        this.draftTokenRows = this.buildTokenRowsFromJson(this.draftTokensJson);
        this.fillSimpleFormFromDraftTokens();
      }),
      map(() => void 0)
    );
  }

  // =========================
  // Preview
  // =========================

  openPreview(): void {
    const t = this.tema;
    if (!t?.slug) return;
    if (!(t as any).draft && !(t as any).published) {
      this.toast.showWarning(this.translate.instant('ADMIN.THEMES.PREVIEW_NO_VERSION'), this.translate.instant('MENU.THEMES'));
      return;
    }
    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.temasService.createPreviewToken(t.slug, ctx).pipe(takeUntil(this.destroy$)).subscribe({
      next: (resp) => {
        const url = (resp as any)?.previewUrl || '';
        const finalUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
        if (finalUrl) window.open(finalUrl, '_blank');
      },
      error: (err) => this.toast.showError(this.extractApiErrorMessage(err), this.translate.instant('MENU.THEMES')),
    });
  }

  // =========================
  // Simple mode: tokens recomendados
  // =========================

  private fillSimpleFormFromDraftTokens(): void {
    const obj = this.safeParseJsonObject(this.draftTokensJson);
    const patch: any = {};
    this.simpleTokenKeys.forEach((k) => {
      if (obj[k] != null) patch[k] = String(obj[k]);
    });
    this.simpleForm.patchValue(patch, { emitEvent: false });
  }

  private syncDraftTokensFromSimple(): void {
    const obj = this.safeParseJsonObject(this.draftTokensJson);
    const v = this.simpleForm.value || {};

    this.simpleTokenKeys.forEach((k) => {
      const val = (v as any)[k];
      if (val == null || String(val).trim() === '') {
        delete obj[k];
      } else {
        obj[k] = String(val).trim();
      }
    });

    this.draftTokensJson = JSON.stringify(obj, null, 2);
    this.draftTokenRows = this.buildTokenRowsFromJson(this.draftTokensJson);
  }

  private applySimpleTokensToRuntime(): void {
    // Preview local: aplicar solo los 6 tokens en :root (sin necesidad de tocar ThemeRuntimeService)
    const root = document.documentElement;
    const v = this.simpleForm.value || {};
    this.simpleTokenKeys.forEach((k) => {
      const val = (v as any)[k];
      if (val == null || String(val).trim() === '') {
        root.style.removeProperty(k);
      } else {
        root.style.setProperty(k, String(val));
      }
    });
  }

  applySelectedPreset(): void {
    if (!this.applyPresetId) return;
    const p = this.presets.find((x) => x.idTemaPreset === this.applyPresetId);
    if (!p) return;
    const baseTokens = this.safeParseJsonObject(this.draftTokensJson);
    const presetTokens = this.safeParseJsonObject(p.tokensJson);
    const mergedTokens = this.applyPresetMode === 'merge' ? { ...baseTokens, ...presetTokens } : presetTokens;
    this.draftTokensJson = JSON.stringify(mergedTokens, null, 2);
    this.draftTokenRows = this.buildTokenRowsFromJson(this.draftTokensJson);
    this.fillSimpleFormFromDraftTokens();
    this.applySimpleTokensToRuntime();
    this.toast.showSuccess(this.translate.instant('ADMIN.THEMES.PRESETS.APPLIED'), this.translate.instant('MENU.THEMES'));
    this.cdr.detectChanges();
  }

  saveDraftFromSimple(): void {
    if (!this.tema?.slug) return;
    // Importante: en modo Simple los cambios viven en el formulario.
    // Antes de guardar, debemos volcar esos 6 tokens al draftTokensJson.
    this.syncDraftTokensFromSimple();
    this.saveDraftInternal();
  }

  // =========================
  // Avanzado: editor tokens
  // =========================

  setDraftEditorMode(mode: 'json' | 'table'): void {
    if (this.draftEditorMode === mode) return;
    if (mode === 'table') {
      this.draftTokenRows = this.buildTokenRowsFromJson(this.draftTokensJson);
      this.draftEditorMode = 'table';
    } else {
      const { json, errors } = this.buildJsonFromTokenRows(this.draftTokenRows);
      if (errors.length) {
        this.toast.showError(errors.join(' · '), this.translate.instant('MENU.THEMES'));
        return;
      }
      this.draftTokensJson = json;
      this.draftEditorMode = 'json';
    }
    this.cdr.detectChanges();
  }

  addDraftTokenRow(): void {
    this.draftTokenRows = [...this.draftTokenRows, { key: '', value: '' }];
    this.cdr.detectChanges();
  }

  removeDraftTokenRow(i: number): void {
    this.draftTokenRows = this.draftTokenRows.filter((_, idx) => idx !== i);
    this.cdr.detectChanges();
  }

  saveDraftAdvanced(): void {
    this.saveDraftInternal();
  }

  private saveDraftInternal(): void {
    if (!this.tema?.slug) return;
    // Si estamos en modo tabla, convertir a JSON y validar
    if (this.draftEditorMode === 'table') {
      const { json, errors } = this.buildJsonFromTokenRows(this.draftTokenRows);
      if (errors.length) {
        this.toast.showError(errors.join(' · '), this.translate.instant('MENU.THEMES'));
        return;
      }
      this.draftTokensJson = json;
      this.draftEditorMode = 'json';
    }

    // Validación mínima
    try {
      JSON.parse(this.draftTokensJson || '{}');
      if (this.draftMetadataJson) JSON.parse(this.draftMetadataJson);
    } catch {
      this.toast.showError(this.translate.instant('COMMON.INVALID_JSON'), this.translate.instant('MENU.THEMES'));
      return;
    }

    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.savingDraft = true;
    this.temasService
      .upsertDraft(this.slug, { tokensJson: this.draftTokensJson, metadataJson: this.draftMetadataJson || undefined }, ctx)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.loadAllAndKeepTab(ctx)),
        finalize(() => {
          this.savingDraft = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => this.toast.showSuccess(this.translate.instant('COMMON.SAVE'), this.translate.instant('MENU.THEMES')),
        error: (err) => this.toast.showError(this.extractApiErrorMessage(err), this.translate.instant('MENU.THEMES')),
      });
  }

  // =========================
  // Versiones
  // =========================

  activateVersion(v: TemaVersion): void {
    if (!this.tema?.slug || !v?.version) return;
    if (this.isActiveVersion(v)) return;
    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.versionsLoading = true;
    this.temasService
      .activate(this.slug, v.version, ctx)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.refreshActiveAndRuntime(ctx)),
        switchMap(() => this.loadAllAndKeepTab(ctx)),
        finalize(() => {
          this.versionsLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => this.toast.showSuccess(this.translate.instant('ADMIN.THEMES.VERSIONS.ACTIVATED'), this.translate.instant('MENU.THEMES')),
        error: (err) => this.toast.showError(this.extractApiErrorMessage(err), this.translate.instant('MENU.THEMES')),
      });
  }

  startEditReleaseNotes(v: TemaVersion): void {
    this.editingReleaseNotesVersion = v?.version ?? null;
    this.editingReleaseNotesText = (v?.releaseNotes || '').toString();
    this.cdr.detectChanges();
  }

  cancelEditReleaseNotes(): void {
    this.editingReleaseNotesVersion = null;
    this.editingReleaseNotesText = '';
    this.cdr.detectChanges();
  }

  saveReleaseNotes(v: TemaVersion): void {
    if (!this.tema?.slug || !v?.version) return;
    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.versionsLoading = true;
    this.temasService
      .updateReleaseNotes(this.slug, v.version, this.editingReleaseNotesText, ctx)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.versionsLoading = false;
          this.editingReleaseNotesVersion = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (updated) => {
          this.publishedVersions = this.publishedVersions.map((x) => (x.version === v.version ? { ...x, ...updated } : x));
          this.toast.showSuccess(this.translate.instant('ADMIN.THEMES.VERSIONS.NOTES_SAVED'), this.translate.instant('MENU.THEMES'));
        },
        error: (err) => this.toast.showError(this.extractApiErrorMessage(err), this.translate.instant('MENU.THEMES')),
      });
  }

  deleteVersion(v: TemaVersion): void {
    if (!this.tema?.slug || !v?.version) return;
    const ok = window.confirm(this.translate.instant('ADMIN.THEMES.VERSIONS.DELETE_CONFIRM_MSG'));
    if (!ok) return;
    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.versionsLoading = true;
    this.temasService
      .deleteVersion(this.slug, v.version, ctx)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.refreshActiveAndRuntime(ctx)),
        switchMap(() => this.loadAllAndKeepTab(ctx)),
        finalize(() => {
          this.versionsLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => this.toast.showSuccess(this.translate.instant('ADMIN.THEMES.VERSIONS.DELETED'), this.translate.instant('MENU.THEMES')),
        error: (err) => this.toast.showError(this.extractApiErrorMessage(err), this.translate.instant('MENU.THEMES')),
      });
  }

  compareVersions(): void {
    if (!this.tema?.slug || !this.versionCompareFrom || !this.versionCompareTo) return;
    const ctx = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true).set(SKIP_GLOBAL_LOADER, true);
    this.versionsLoading = true;
    this.temasService
      .compareVersions(this.slug, this.versionCompareFrom, this.versionCompareTo, ctx)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.versionsLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (r) => (this.versionCompareResult = r),
        error: (err) => this.toast.showError(this.extractApiErrorMessage(err), this.translate.instant('MENU.THEMES')),
      });
  }

  // =========================
  // Helpers JSON/table
  // =========================

  private safeParseJsonObject(text: string | null | undefined): Record<string, any> {
    if (!text || !text.trim()) return {};
    try {
      const v = JSON.parse(text);
      if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
      return v;
    } catch {
      return {};
    }
  }

  private buildTokenRowsFromJson(tokensJson: string): Array<{ key: string; value: string }> {
    const obj = this.safeParseJsonObject(tokensJson);
    const rows = Object.keys(obj)
      .sort()
      .map((k) => ({ key: k, value: obj[k] == null ? '' : String(obj[k]) }));
    return rows.length ? rows : [{ key: '', value: '' }];
  }

  private buildJsonFromTokenRows(rows: Array<{ key: string; value: string }>): { json: string; errors: string[] } {
    const errors: string[] = [];
    const out: Record<string, string> = {};
    const seen = new Set<string>();
    (rows || []).forEach((r, idx) => {
      const k = (r?.key || '').trim();
      const v = (r?.value || '').toString();
      if (!k && !v) return;
      if (!k.startsWith('--')) errors.push(this.translate.instant('ADMIN.THEMES.DRAFT.TABLE_ERR_TOKEN', { i: idx + 1 }));
      if (seen.has(k)) errors.push(this.translate.instant('ADMIN.THEMES.DRAFT.TABLE_ERR_DUP', { token: k }));
      seen.add(k);
      out[k] = v;
    });
    return { json: JSON.stringify(out, null, 2), errors };
  }
}
