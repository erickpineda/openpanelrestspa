import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';

export interface UserSubscriptions {
  categorias: string[];
  etiquetas: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PublicSubscriptionsService {
  private readonly defaultSubs: UserSubscriptions = { categorias: [], etiquetas: [] };
  private subs$ = new BehaviorSubject<UserSubscriptions>(this.defaultSubs);
  private apiUrl = `${environment.backend.host}${environment.backend.uri}/usuarios`;

  constructor(
    private tokenStorage: TokenStorageService,
    private http: HttpClient
  ) {}

  observeSubscriptions(): Observable<UserSubscriptions> {
    return this.subs$.asObservable();
  }

  getCurrentSubscriptions(): UserSubscriptions {
    return this.subs$.value;
  }

  setInitialSubscriptions(subs: UserSubscriptions): void {
    this.subs$.next(subs || this.defaultSubs);
  }

  toggleCategoria(categoriaCodigo: string): boolean {
    const subs = { ...this.subs$.value };
    subs.categorias = [...subs.categorias];
    
    const idx = subs.categorias.indexOf(categoriaCodigo);
    const isSubscribed = idx >= 0;
    
    if (isSubscribed) {
      subs.categorias.splice(idx, 1);
    } else {
      subs.categorias.push(categoriaCodigo);
    }
    
    this.subs$.next(subs);
    
    const username = this.getUsername();
    if (username) {
      const url = `${this.apiUrl}/${username}/suscripciones/categorias/${encodeURIComponent(categoriaCodigo)}`;
      const request = isSubscribed ? this.http.delete(url) : this.http.post(url, {});
      
      request.pipe(
        catchError(() => {
          // Revert on error
          const revertSubs = { ...this.subs$.value };
          revertSubs.categorias = [...revertSubs.categorias];
          const revIdx = revertSubs.categorias.indexOf(categoriaCodigo);
          if (isSubscribed && revIdx < 0) {
             revertSubs.categorias.push(categoriaCodigo);
          } else if (!isSubscribed && revIdx >= 0) {
             revertSubs.categorias.splice(revIdx, 1);
          }
          this.subs$.next(revertSubs);
          return of(null);
        })
      ).subscribe();
    }
    
    return !isSubscribed;
  }

  toggleEtiqueta(etiquetaCodigo: string): boolean {
    const subs = { ...this.subs$.value };
    subs.etiquetas = [...subs.etiquetas];
    
    const idx = subs.etiquetas.indexOf(etiquetaCodigo);
    const isSubscribed = idx >= 0;
    
    if (isSubscribed) {
      subs.etiquetas.splice(idx, 1);
    } else {
      subs.etiquetas.push(etiquetaCodigo);
    }
    
    this.subs$.next(subs);
    
    const username = this.getUsername();
    if (username) {
      const url = `${this.apiUrl}/${username}/suscripciones/etiquetas/${encodeURIComponent(etiquetaCodigo)}`;
      const request = isSubscribed ? this.http.delete(url) : this.http.post(url, {});
      
      request.pipe(
        catchError(() => {
          // Revert on error
          const revertSubs = { ...this.subs$.value };
          revertSubs.etiquetas = [...revertSubs.etiquetas];
          const revIdx = revertSubs.etiquetas.indexOf(etiquetaCodigo);
          if (isSubscribed && revIdx < 0) {
             revertSubs.etiquetas.push(etiquetaCodigo);
          } else if (!isSubscribed && revIdx >= 0) {
             revertSubs.etiquetas.splice(revIdx, 1);
          }
          this.subs$.next(revertSubs);
          return of(null);
        })
      ).subscribe();
    }
    
    return !isSubscribed;
  }

  private getUsername(): string | null {
    const user = this.tokenStorage.getUser();
    return user?.username ?? null;
  }
}