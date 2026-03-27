import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { OPConstants } from '@shared/constants/op-global.constants';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@env/environment';
import { catchError, map, tap } from 'rxjs/operators';
import { OpenpanelApiResponse, PaginatedResponse } from '@app/core/models/openpanel-api-response.model';

export interface PublicBookmark {
  idEntrada?: number;
  slug: string;
  titulo: string | null;
  resumen: string | null;
  fechaPublicacion: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class PublicBookmarksService {
  private readonly slugs$ = new BehaviorSubject<Set<string>>(new Set<string>());
  private apiUrl = `${environment.backend.host}${environment.backend.uri}/usuarios`;
  private jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(
    private tokenStorage: TokenStorageService,
    private http: HttpClient
  ) {}

  observeSlugs(): Observable<Set<string>> {
    return this.slugs$.asObservable();
  }

  isBookmarked(slug: string | null | undefined): boolean {
    if (!slug) return false;
    return this.slugs$.value.has(slug);
  }

  setInitialSlugs(slugs: string[]): void {
    this.slugs$.next(new Set(slugs));
  }

  toggle(entrada: PublicBookmark): { bookmarked: boolean } {
    const slug = entrada?.slug;
    if (!slug) return { bookmarked: false };
    
    const slugs = new Set(this.slugs$.value);
    const username = this.getUsername();
    
    if (slugs.has(slug)) {
      // Optimizacion UI: Removemos inmediatamente
      slugs.delete(slug);
      this.slugs$.next(slugs);
      
      if (username) {
        this.http.delete(`${this.apiUrl}/${username}/bookmarks/${slug}`).pipe(
          catchError(() => {
            // Revertir si falla
            const revertSlugs = new Set(this.slugs$.value);
            revertSlugs.add(slug);
            this.slugs$.next(revertSlugs);
            return of(null);
          })
        ).subscribe();
      }
      return { bookmarked: false };
    }

    // Optimizacion UI: Añadimos inmediatamente
    slugs.add(slug);
    this.slugs$.next(slugs);
    
    if (username) {
      this.http.post(`${this.apiUrl}/${username}/bookmarks/${slug}`, {}).pipe(
        catchError(() => {
          // Revertir si falla
          const revertSlugs = new Set(this.slugs$.value);
          revertSlugs.delete(slug);
          this.slugs$.next(revertSlugs);
          return of(null);
        })
      ).subscribe();
    }
    
    return { bookmarked: true };
  }

  remove(slug: string): void {
    if (!slug) return;
    
    const slugs = new Set(this.slugs$.value);
    const username = this.getUsername();

    if (slugs.has(slug)) {
      slugs.delete(slug);
      this.slugs$.next(slugs);
      
      if (username) {
        this.http.delete(`${this.apiUrl}/${username}/bookmarks/${slug}`).pipe(
          catchError(() => {
            const revertSlugs = new Set(this.slugs$.value);
            revertSlugs.add(slug);
            this.slugs$.next(revertSlugs);
            return of(null);
          })
        ).subscribe();
      }
    }
  }

  clearAll(): void {
    const previousSlugs = new Set(this.slugs$.value);
    this.slugs$.next(new Set<string>());
    
    const username = this.getUsername();
    if (username) {
      this.http.delete(`${this.apiUrl}/${username}/bookmarks`).pipe(
        catchError(() => {
          this.slugs$.next(previousSlugs);
          return of(null);
        })
      ).subscribe();
    }
  }

  getBookmarks(): Observable<PublicBookmark[]> {
    const username = this.getUsername();
    if (!username) return of([]);
    return this.http
      .get<
        | OpenpanelApiResponse<PaginatedResponse<PublicBookmark> | PublicBookmark[]>
        | PaginatedResponse<PublicBookmark>
        | PublicBookmark[]
      >(`${this.apiUrl}/${username}/bookmarks`, { headers: this.jsonHeaders })
      .pipe(
        map((r: any) => r?.data ?? r),
        map((data: any) => {
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.elements)) return data.elements;
          if (Array.isArray(data?.items)) return data.items;
          if (Array.isArray(data?.content)) return data.content;
          return [];
        }),
      catchError(() => of([]))
    );
  }

  private getUsername(): string | null {
    const user = this.tokenStorage.getUser();
    return user?.username ?? null;
  }
}
