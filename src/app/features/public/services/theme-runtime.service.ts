import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { retry } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { PublicThemesService } from '@app/core/services/data/public-themes.service';
import { PublicTheme } from '@app/core/models/public-theme.model';
import { environment } from '@env/environment';

type PreviewContext =
  | { kind: 'local'; theme: PublicTheme; savedAt: string }
  | { kind: 'token'; previewThemeSlug: string; previewToken: string; theme?: PublicTheme; savedAt: string };

@Injectable({ providedIn: 'root' })
export class ThemeRuntimeService {
  private appliedSignature?: string;
  private appliedTokenKeys = new Set<string>();
  private readonly PREVIEW_FALLBACK_EVENT = 'op-theme-preview-fallback';
  private readonly PREVIEW_CONTEXT_KEY = 'op-theme-preview-context';

  constructor(private publicThemes: PublicThemesService) {}

  /**
   * Inicializa el tema público en base a query params.
   * - Si hay previewThemeSlug + previewToken => preview
   * - Si no => active
   */
  initFromRoute(route: ActivatedRoute) {
    const qp = route.snapshot.queryParamMap;
    const previewThemeSlug = qp.get('previewThemeSlug');
    const previewToken = qp.get('previewToken');
    const localThemeKey = qp.get('localThemeKey');

    // Preview local: tokens almacenados en session/localStorage, sin llamada al backend.
    if (localThemeKey) {
      const theme = this.loadLocalPreview(localThemeKey);
      if (theme) {
        this.applyTheme(theme, `local:${localThemeKey}`);
        this.savePreviewContext({ kind: 'local', theme, savedAt: new Date().toISOString() });
        return of(void 0);
      }
    }

    if (previewThemeSlug && previewToken) {
      // Usar modo estricto para evitar fallback silencioso a "default" en caso de error.
      return this.publicThemes.getPreviewStrict(previewThemeSlug, previewToken).pipe(
        retry(2),
        // Incluir token para que re-aplique si cambia la preview (p.ej. nuevo token tras modificar borrador)
        tap((t) => {
          this.applyTheme(t, `preview:${previewThemeSlug}:${previewToken}`);
          // Guardar contexto para poder navegar por toda la app manteniendo la preview
          this.savePreviewContext({
            kind: 'token',
            previewThemeSlug,
            previewToken,
            theme: t,
            savedAt: new Date().toISOString(),
          });
        }),
        catchError((err: HttpErrorResponse) => {
          // Si el token es inválido/expiró, hacemos fallback a activo.
          // Si es un fallo transitorio, preferimos NO sobreescribir el tema actual para evitar "parpadeos".
          const status = err?.status ?? 0;
          // Si el token es inválido/expiró => volver a tema activo.
          if (status === 401 || status === 403 || status === 404) {
            this.emitPreviewFallback({ kind: 'token_invalid', status, previewThemeSlug });
            return this.publicThemes.getActive().pipe(
              tap((t) => this.applyTheme(t, 'active')),
              map(() => void 0)
            );
          }
          // Fallo transitorio (timeout/red/etc.): mejor aplicar activo para evitar estado "sin tema"
          this.emitPreviewFallback({ kind: 'transient_error', status, previewThemeSlug });
          return this.publicThemes.getActive().pipe(
            tap((t) => this.applyTheme(t, 'active')),
            map(() => void 0)
          );
        }),
        map(() => void 0)
      );
    }

    // Si no hay query params de preview, pero existe contexto guardado en esta pestaña,
    // mantenemos la preview durante la navegación.
    const ctx = this.loadPreviewContext();
    if (ctx?.kind === 'local' && ctx.theme) {
      this.applyTheme(ctx.theme, `local:stored:${this.hashString(ctx.savedAt || '')}`);
      return of(void 0);
    }
    if (ctx?.kind === 'token') {
      // Para estabilidad: aplicar el último tema recibido (si existe) y no depender del backend en cada navegación.
      if (ctx.theme) {
        this.applyTheme(ctx.theme, `preview:stored:${ctx.previewThemeSlug}:${ctx.previewToken}`);
        return of(void 0);
      }
      // Si no hay theme cacheado, intentamos cargarlo una vez.
      if (ctx.previewThemeSlug && ctx.previewToken) {
        return this.publicThemes.getPreviewStrict(ctx.previewThemeSlug, ctx.previewToken).pipe(
          retry(1),
          tap((t) => {
            this.applyTheme(t, `preview:stored:${ctx.previewThemeSlug}:${ctx.previewToken}`);
            this.savePreviewContext({
              ...ctx,
              kind: 'token',
              theme: t,
              savedAt: new Date().toISOString(),
            });
          }),
          catchError(() => of(void 0)),
          map(() => void 0)
        );
      }
    }

    return this.publicThemes.getActive().pipe(
      tap((t) => this.applyTheme(t, 'active')),
      map(() => void 0),
      catchError(() => of(void 0))
    );
  }

  private loadLocalPreview(key: string): PublicTheme | null {
    const storageKey = `op-theme-local-preview:${key}`;
    const raw = (() => {
      try {
        const v = sessionStorage.getItem(storageKey);
        if (v) return v;
      } catch {}
      try {
        const v = localStorage.getItem(storageKey);
        if (v) return v;
      } catch {}
      return null;
    })();

    if (!raw) return null;
    // One-shot: borrar al leer para evitar crecimiento infinito del storage
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    this.cleanupLocalPreviewStorage();
    try {
      const obj: any = JSON.parse(raw);
      return {
        slug: obj?.slug || 'local',
        tokensJson: obj?.tokensJson || '{}',
        cssUrl: obj?.cssUrl ?? null,
        assetsUrl: obj?.assetsUrl ?? null,
      } as any;
    } catch {
      return null;
    }
  }

  private cleanupLocalPreviewStorage(maxEntries = 20, maxAgeMs = 24 * 60 * 60 * 1000): void {
    try {
      const prefix = 'op-theme-local-preview:';
      const now = Date.now();
      const items: Array<{ key: string; ts: number }> = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(prefix)) continue;
        const raw = localStorage.getItem(k) || '';
        let ts = 0;
        try {
          const obj: any = JSON.parse(raw);
          ts = Date.parse(obj?.createdAt || '');
        } catch {}
        const safeTs = isNaN(ts) ? 0 : ts;
        items.push({ key: k, ts: safeTs });
        if (safeTs > 0 && now - safeTs > maxAgeMs) {
          localStorage.removeItem(k);
        }
      }
      if (items.length > maxEntries) {
        const sorted = items.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        sorted.slice(maxEntries).forEach(({ key }) => localStorage.removeItem(key));
      }
    } catch {
      // ignore
    }
  }

  private emitPreviewFallback(detail: { kind: string; status?: number; previewThemeSlug?: string }) {
    try {
      window.dispatchEvent(new CustomEvent(this.PREVIEW_FALLBACK_EVENT, { detail }));
    } catch {
      // ignore
    }
  }

  private savePreviewContext(ctx: PreviewContext) {
    try {
      sessionStorage.setItem(this.PREVIEW_CONTEXT_KEY, JSON.stringify(ctx));
    } catch {
      // ignore
    }
  }

  private loadPreviewContext(): PreviewContext | null {
    try {
      const raw = sessionStorage.getItem(this.PREVIEW_CONTEXT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PreviewContext;
    } catch {
      return null;
    }
  }

  /**
   * Fuerza recarga del tema activo (útil tras "Activar" en admin).
   */
  refreshActive() {
    return this.publicThemes.getActive().pipe(
      tap((t) => this.applyTheme(t, 'active')),
      map(() => void 0),
      catchError(() => of(void 0))
    );
  }

  private applyTheme(theme: PublicTheme, key: string) {
    if (!theme) return;
    const signature = this.buildSignature(theme, key);
    if (this.appliedSignature === signature) return;

    this.applyTokens(theme.tokensJson);
    this.applyCssUrl(theme.cssUrl);
    this.appliedSignature = signature;
  }

  private buildSignature(theme: PublicTheme, key: string): string {
    const slug = theme.slug ?? '';
    const cssUrl = theme.cssUrl ?? '';
    const assetsUrl = (theme as any).assetsUrl ?? '';
    const tokenHash = this.hashString(theme.tokensJson ?? '');
    return `${key}|${slug}|${cssUrl}|${assetsUrl}|${tokenHash}`;
  }

  // Hash simple para evitar guardar tokensJson completos como firma
  private hashString(s: string): number {
    let hash = 5381;
    for (let i = 0; i < s.length; i++) {
      hash = (hash * 33) ^ s.charCodeAt(i);
    }
    // Forzar uint32
    return hash >>> 0;
  }

  private applyTokens(tokensJson: string) {
    let obj: any;
    try {
      obj = JSON.parse(tokensJson || '{}');
    } catch {
      // Si no se puede parsear, no tocamos los tokens ya aplicados.
      return;
    }
    if (!obj || typeof obj !== 'object') return;

    const root = document.documentElement;
    const nextKeys = new Set<string>();

    Object.keys(obj).forEach((k) => {
      // Hardening: solo permitir CSS variables y prevenir prototype pollution
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
      if (!k.startsWith('--')) return;
      const v = obj[k];
      if (typeof k === 'string' && (typeof v === 'string' || typeof v === 'number')) {
        nextKeys.add(k);
        root.style.setProperty(k, String(v));
      }
    });

    // Quitar variables que estaban aplicadas pero ya no vienen en el tema actual.
    // Esto es clave para que "Restaurar por defecto" tenga efecto sin recargar.
    this.appliedTokenKeys.forEach((k) => {
      if (!nextKeys.has(k)) {
        root.style.removeProperty(k);
      }
    });
    this.appliedTokenKeys = nextKeys;
  }

  private applyCssUrl(cssUrl?: string | null) {
    const id = 'op-theme-css';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!cssUrl) {
      // Si el tema activo no trae CSS, eliminamos el link del tema anterior.
      if (link) link.remove();
      return;
    }

    const href = this.toAbsoluteUrl(cssUrl);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== href) {
      link.href = href;
    }
  }

  private toAbsoluteUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    // Si el backend ya devuelve /api/v1/..., solo prefijamos host
    if (url.startsWith('/api/')) return `${environment.backend.host}${url}`;
    return `${environment.backend.host}${environment.backend.uri}${url}`;
  }
}
