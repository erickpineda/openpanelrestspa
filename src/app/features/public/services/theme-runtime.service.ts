import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { PublicThemesService } from '@app/core/services/data/public-themes.service';
import { PublicTheme } from '@app/core/models/public-theme.model';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ThemeRuntimeService {
  private appliedKey?: string;

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
      return this.publicThemes.getPreview(previewThemeSlug, previewToken).pipe(
        tap((t) => this.applyTheme(t, `preview:${previewThemeSlug}`)),
        catchError(() =>
          this.publicThemes.getActive().pipe(
            tap((t) => this.applyTheme(t, 'active')),
            map(() => void 0)
          )
        ),
        map(() => void 0)
      );
    }

    return this.publicThemes.getActive().pipe(
      tap((t) => this.applyTheme(t, 'active')),
      map(() => void 0),
      catchError(() => of(void 0))
    );
  }

  private applyTheme(theme: PublicTheme, key: string) {
    if (!theme) return;
    if (this.appliedKey === key) return;

    this.applyTokens(theme.tokensJson);
    this.applyCssUrl(theme.cssUrl);
    this.appliedKey = key;
  }

  private applyTokens(tokensJson: string) {
    if (!tokensJson) return;

    let obj: any;
    try {
      obj = JSON.parse(tokensJson);
    } catch {
      return;
    }
    if (!obj || typeof obj !== 'object') return;

    const root = document.documentElement;
    Object.keys(obj).forEach((k) => {
      // Hardening: solo permitir CSS variables y prevenir prototype pollution
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
      if (!k.startsWith('--')) return;
      const v = obj[k];
      if (typeof k === 'string' && (typeof v === 'string' || typeof v === 'number')) {
        root.style.setProperty(k, String(v));
      }
    });
  }

  private applyCssUrl(cssUrl?: string | null) {
    if (!cssUrl) return;
    const href = this.toAbsoluteUrl(cssUrl);

    const id = 'op-theme-css';
    let link = document.getElementById(id) as HTMLLinkElement | null;
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
