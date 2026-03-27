import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';
import { PublicBookmarksService } from '@app/features/public/entradas/services/public-bookmarks.service';
import { PublicVotesService } from '@app/features/public/entradas/services/public-votes.service';
import { PublicSubscriptionsService } from '@app/features/public/services/public-subscriptions.service';
import { ReaderPreferencesService } from '@app/features/public/services/reader-preferences.service';
import { UserInteractionsResponse } from '../../models/user-interactions.model';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { OpenpanelApiResponse } from '../../models/openpanel-api-response.model';

@Injectable({
  providedIn: 'root'
})
export class UserInteractionsSyncService {
  private apiUrl = `${environment.backend.host}${environment.backend.uri}/usuarios`;
  private jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });
  private importedFlagPrefix = 'public-interactions-imported:';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private bookmarksService: PublicBookmarksService,
    private votesService: PublicVotesService,
    private subscriptionsService: PublicSubscriptionsService,
    private readerPrefsService: ReaderPreferencesService
  ) {}

  init(): void {
    this.authService.user$.pipe(
      // Si el usuario se desloguea (null), limpiamos el estado en memoria si es necesario
      tap(user => {
        if (!user) {
          this.bookmarksService.setInitialSlugs([]);
          this.votesService.setInitialSlugs([]);
          this.subscriptionsService.setInitialSubscriptions({ categorias: [], etiquetas: [] });
          // Restablecer tema y tamaño a los defaults/auto al cerrar sesión
          this.readerPrefsService.resetToDefaultOrSystem();
        }
      }),
      // Solo continuamos si hay un usuario con username
      filter(user => !!user?.username),
      switchMap(user =>
        this.importLegacyIfNeeded(user).pipe(
          switchMap(() =>
            this.http
              .get<OpenpanelApiResponse<UserInteractionsResponse> | UserInteractionsResponse>(
                `${this.apiUrl}/${user.username}/interacciones`,
                { headers: this.jsonHeaders }
              )
              .pipe(
                map((r: any) => r?.data ?? r),
                catchError(() => of(null))
              )
          )
        )
      )
    ).subscribe(response => {
      if (response) {
        this.bookmarksService.setInitialSlugs(response.bookmarksSlugs || []);
        this.votesService.setInitialSlugs(response.votosSlugs || []);
        this.subscriptionsService.setInitialSubscriptions({
          categorias: response.suscripciones?.categoriasCodigos || [],
          etiquetas: response.suscripciones?.etiquetasCodigos || []
        });
        if (response.preferencias) {
          this.readerPrefsService.setInitialPreferences(response.preferencias);
        }
      }
    });
  }

  private importLegacyIfNeeded(user: any) {
    try {
      const username = String(user?.username ?? '').trim();
      if (!username) return of(null);

      const alreadyImported = localStorage.getItem(`${this.importedFlagPrefix}${username}`) === '1';
      if (alreadyImported) return of(null);

      const legacy = this.readLegacyLocalState(user);
      const hasSomething =
        (legacy.bookmarksSlugs?.length ?? 0) > 0 || (legacy.votosSlugs?.length ?? 0) > 0;
      if (!hasSomething) return of(null);

      return this.http
        .post<any>(
          `${this.apiUrl}/${username}/interacciones/import`,
          {
            bookmarksSlugs: legacy.bookmarksSlugs,
            votosSlugs: legacy.votosSlugs,
          },
          { headers: this.jsonHeaders }
        )
        .pipe(
          tap(() => {
            localStorage.setItem(`${this.importedFlagPrefix}${username}`, '1');
            this.cleanupLegacyLocalData(user);
          }),
          catchError(() => of(null))
        );
    } catch (e) {
      return of(null);
    }
  }

  private readLegacyLocalState(user: any): { bookmarksSlugs: string[]; votosSlugs: string[] } {
    const ids: string[] = [];
    const candidates = [user?.idUsuario, user?.id, user?.userId, user?.username]
      .map((v) => (v == null ? null : String(v)))
      .filter((v): v is string => !!v && v.trim().length > 0);
    candidates.forEach((v) => ids.push(v));

    const bookmarksSlugs = this.extractLegacySlugs('public-bookmarks:', ids);
    const votosSlugs = this.extractLegacySlugs('public-votes:', ids);

    return { bookmarksSlugs, votosSlugs };
  }

  private extractLegacySlugs(prefix: string, ids: string[]): string[] {
    const raw = this.getFirstLocalStorageValue(prefix, ids);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const slugs = parsed
          .map((x) => {
            if (typeof x === 'string') return x;
            const maybeSlug = (x as any)?.slug ?? (x as any)?.entrada_slug ?? null;
            return typeof maybeSlug === 'string' ? maybeSlug : null;
          })
          .filter((s): s is string => !!s && s.trim().length > 0)
          .map((s) => s.trim());
        return Array.from(new Set(slugs));
      }
    } catch {}
    return [];
  }

  private getFirstLocalStorageValue(prefix: string, ids: string[]): string | null {
    for (const id of ids) {
      const key = `${prefix}${id}`;
      const val = localStorage.getItem(key);
      if (val) return val;
    }
    return null;
  }

  private cleanupLegacyLocalData(user: any): void {
    try {
      const candidates = [user?.idUsuario, user?.id, user?.userId, user?.username]
        .map((v) => (v == null ? null : String(v)))
        .filter((v): v is string => !!v && v.trim().length > 0);
      const prefixes = ['public-bookmarks:', 'public-votes:', 'public-subs:'];
      prefixes.forEach((p) => {
        candidates.forEach((id) => {
          localStorage.removeItem(`${p}${id}`);
        });
      });
    } catch {}
  }
}
