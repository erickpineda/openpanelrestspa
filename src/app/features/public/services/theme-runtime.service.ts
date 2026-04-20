import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { retry } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { PublicThemesService } from '@app/core/services/data/public-themes.service';
import { PublicTheme } from '@app/core/models/public-theme.model';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ThemeRuntimeService {
  private appliedSignature?: string;
  private appliedTokenKeys = new Set<string>();

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

    if (previewThemeSlug && previewToken) {
      // Usar modo estricto para evitar fallback silencioso a "default" en caso de error.
      return this.publicThemes.getPreviewStrict(previewThemeSlug, previewToken).pipe(
        retry(1),
        // Incluir token para que re-aplique si cambia la preview (p.ej. nuevo token tras modificar borrador)
        tap((t) => this.applyTheme(t, `preview:${previewThemeSlug}:${previewToken}`)),
        catchError((err: HttpErrorResponse) => {
          // Si el token es inválido/expiró, hacemos fallback a activo.
          // Si es un fallo transitorio, preferimos NO sobreescribir el tema actual para evitar "parpadeos".
          const status = err?.status ?? 0;
          if (status === 401 || status === 403 || status === 404) {
            return this.publicThemes.getActive().pipe(
              tap((t) => this.applyTheme(t, 'active')),
              map(() => void 0)
            );
          }
          return of(void 0);
        }),
        map(() => void 0)
      );
    }

    return this.publicThemes.getActive().pipe(
      tap((t) => this.applyTheme(t, 'active')),
      map(() => void 0),
      catchError(() => of(void 0))
    );
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
