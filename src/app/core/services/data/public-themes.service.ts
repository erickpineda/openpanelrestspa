import { Injectable } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
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

