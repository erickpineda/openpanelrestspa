import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { BaseService } from '../../_utils/base.service';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';

@Injectable({ providedIn: 'root' })
export class SystemSettingsRuntimeService extends BaseService {
  private readonly endpoint = '/config/ajustes';
  private readonly publicKeys = [
    'site.name',
    'site.description',
    'comments.enabled',
    'listings.entries.defaultPageSize',
    'integrations.social.share.enabled',
  ] as const;

  private readonly settings = new Map<string, string>();
  private loadOnce$?: Observable<void>;

  constructor(protected override http: HttpClient) {
    super(http);
  }

  loadPublicSettings(): Observable<void> {
    if (this.loadOnce$) {
      return this.loadOnce$;
    }

    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    const requests = this.publicKeys.map((key) => this.loadPublicKey(key, context));

    this.loadOnce$ = forkJoin(requests).pipe(
      map(() => void 0),
      catchError(() => of(void 0)),
      shareReplay(1)
    );

    return this.loadOnce$;
  }

  getString(key: string, fallback: string): string {
    const value = this.settings.get(key);
    const normalized = value != null ? String(value).trim() : '';
    return normalized.length > 0 ? normalized : fallback;
  }

  getBoolean(key: string, fallback: boolean): boolean {
    const value = this.settings.get(key);
    if (value == null) {
      return fallback;
    }

    switch (String(value).trim().toLowerCase()) {
      case 'true':
      case '1':
      case 'yes':
      case 'on':
        return true;
      case 'false':
      case '0':
      case 'no':
      case 'off':
        return false;
      default:
        return fallback;
    }
  }

  getNumber(key: string, fallback: number): number {
    const value = this.settings.get(key);
    if (value == null) {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private loadPublicKey(key: string, context: HttpContext): Observable<void> {
    return this.safeGetData<unknown>(
      `${this.endpoint}/publico/clave/${encodeURIComponent(key)}`,
      null,
      undefined,
      undefined,
      `${this.endpoint}.publico.${key}`,
      context
    ).pipe(
      map((payload) => {
        const value = this.extractValue(payload);
        if (value !== null) {
          this.settings.set(key, value);
        }
        return void 0;
      })
    );
  }

  private extractValue(payload: unknown): string | null {
    if (payload == null) {
      return null;
    }

    if (
      typeof payload === 'string' ||
      typeof payload === 'number' ||
      typeof payload === 'boolean'
    ) {
      return String(payload);
    }

    if (typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const candidate =
        record['valor'] ??
        record['value'] ??
        ((record['data'] as Record<string, unknown> | undefined)?.['valor']) ??
        ((record['data'] as Record<string, unknown> | undefined)?.['value']) ??
        null;

      return candidate != null ? String(candidate) : null;
    }

    return null;
  }
}
