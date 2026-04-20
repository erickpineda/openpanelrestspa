import { Injectable } from '@angular/core';
import { HttpContext, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService } from '../../_utils/base.service';
import { PublicTheme } from '../../models/public-theme.model';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';

@Injectable({ providedIn: 'root' })
export class PublicThemesService extends BaseService {
  private endpoint = '/public/themes';

  getActive(skipLoader: boolean = true): Observable<PublicTheme> {
    const context = skipLoader ? new HttpContext().set(SKIP_GLOBAL_LOADER, true) : undefined;
    return this.safeGetData<PublicTheme>(
      `${this.endpoint}/active`,
      { slug: 'default', tokensJson: '{}' },
      undefined,
      undefined,
      'publicThemes.active',
      context
    );
  }

  /**
   * Preview "estricto": NO devuelve default en caso de error.
   * Esto evita comportamientos aleatorios (fallback silencioso) cuando el endpoint falla o el token expira.
   */
  getPreviewStrict(
    previewThemeSlug: string,
    previewToken: string,
    skipLoader: boolean = true
  ): Observable<PublicTheme> {
    const context = skipLoader ? new HttpContext().set(SKIP_GLOBAL_LOADER, true) : undefined;
    const params = { previewThemeSlug, previewToken };

    // Hardening: evitar cachés intermedias
    const headers = this.setHeaders({
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    });

    return this.get<PublicTheme>(`${this.endpoint}/preview`, params, headers, context).pipe(
      map((resp) => resp?.data as PublicTheme)
    );
  }

  getPreview(
    previewThemeSlug: string,
    previewToken: string,
    skipLoader: boolean = true
  ): Observable<PublicTheme> {
    const context = skipLoader ? new HttpContext().set(SKIP_GLOBAL_LOADER, true) : undefined;
    const params = {
      previewThemeSlug,
      previewToken,
    };
    return this.safeGetData<PublicTheme>(
      `${this.endpoint}/preview`,
      { slug: 'default', tokensJson: '{}' },
      params,
      undefined,
      'publicThemes.preview',
      context
    );
  }
}
