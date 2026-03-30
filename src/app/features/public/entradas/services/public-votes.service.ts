import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@env/environment';
import { catchError, map } from 'rxjs/operators';
import { PublicBookmark } from './public-bookmarks.service';
import { OpenpanelApiResponse, PaginatedResponse } from '@app/core/models/openpanel-api-response.model';

@Injectable({
  providedIn: 'root',
})
export class PublicVotesService {
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

  hasVoted(slug: string | null | undefined): boolean {
    if (!slug) return false;
    return this.slugs$.value.has(slug);
  }

  setInitialSlugs(slugs: string[]): void {
    this.slugs$.next(new Set(slugs));
  }

  addVote(entrada: PublicBookmark): void {
    const slug = entrada?.slug;
    if (!slug) return;
    
    const slugs = new Set(this.slugs$.value);
    if (slugs.has(slug)) return; // Ya votado

    const username = this.getUsername();
    
    // UI Optimista
    slugs.add(slug);
    this.slugs$.next(slugs);
    
    if (username) {
      this.http.post(`${this.apiUrl}/${username}/votos/${slug}`, {}).pipe(
        catchError(() => {
          const revertSlugs = new Set(this.slugs$.value);
          revertSlugs.delete(slug);
          this.slugs$.next(revertSlugs);
          return of(null);
        })
      ).subscribe();
    }
  }

  removeVote(slug: string): void {
    if (!slug) return;
    
    const slugs = new Set(this.slugs$.value);
    const username = this.getUsername();

    if (slugs.has(slug)) {
      slugs.delete(slug);
      this.slugs$.next(slugs);
      
      if (username) {
        this.http.delete(`${this.apiUrl}/${username}/votos/${slug}`).pipe(
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
      this.http.delete(`${this.apiUrl}/${username}/votos`).pipe(
        catchError(() => {
          this.slugs$.next(previousSlugs);
          return of(null);
        })
      ).subscribe();
    }
  }

  getVotes(): Observable<PublicBookmark[]> {
    const username = this.getUsername();
    if (!username) return of([]);
    return this.http
      .get<
        | OpenpanelApiResponse<PaginatedResponse<PublicBookmark> | PublicBookmark[]>
        | PaginatedResponse<PublicBookmark>
        | PublicBookmark[]
      >(`${this.apiUrl}/${username}/votos`, { headers: this.jsonHeaders })
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
