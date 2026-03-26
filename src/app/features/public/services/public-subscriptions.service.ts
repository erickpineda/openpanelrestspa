import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OPConstants } from '@shared/constants/op-global.constants';
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
  private loadedKey: string | null = null;

  constructor(private tokenStorage: TokenStorageService) {}

  observeSubscriptions() {
    this.ensureLoaded();
    return this.subs$.asObservable();
  }

  getCurrentSubscriptions(): UserSubscriptions {
    this.ensureLoaded();
    return this.subs$.value;
  }

  toggleCategoria(categoria: string): boolean {
    this.ensureLoaded();
    const subs = { ...this.subs$.value };
    subs.categorias = [...subs.categorias];
    
    const idx = subs.categorias.indexOf(categoria);
    const isSubscribed = idx >= 0;
    
    if (isSubscribed) {
      subs.categorias.splice(idx, 1);
    } else {
      subs.categorias.push(categoria);
    }
    
    this.subs$.next(subs);
    this.saveSubscriptions(subs);
    return !isSubscribed;
  }

  toggleEtiqueta(etiqueta: string): boolean {
    this.ensureLoaded();
    const subs = { ...this.subs$.value };
    subs.etiquetas = [...subs.etiquetas];
    
    const idx = subs.etiquetas.indexOf(etiqueta);
    const isSubscribed = idx >= 0;
    
    if (isSubscribed) {
      subs.etiquetas.splice(idx, 1);
    } else {
      subs.etiquetas.push(etiqueta);
    }
    
    this.subs$.next(subs);
    this.saveSubscriptions(subs);
    return !isSubscribed;
  }

  private ensureLoaded(): void {
    const key = this.getStorageKey();
    if (!key) {
      this.loadedKey = null;
      this.subs$.next(this.defaultSubs);
      return;
    }
    if (this.loadedKey === key) return;
    
    this.loadedKey = key;
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.subs$.next(this.defaultSubs);
      return;
    }
    
    try {
      const parsed = JSON.parse(raw);
      this.subs$.next({
        categorias: Array.isArray(parsed.categorias) ? parsed.categorias : [],
        etiquetas: Array.isArray(parsed.etiquetas) ? parsed.etiquetas : []
      });
    } catch {
      this.subs$.next(this.defaultSubs);
    }
  }

  private saveSubscriptions(subs: UserSubscriptions): void {
    const key = this.getStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(subs));
  }

  private getStorageKey(): string | null {
    const user = this.tokenStorage.getUser();
    if (!user) return null;
    const userId = user.idUsuario ?? user.id ?? user.userId ?? user.username ?? null;
    if (!userId) return null;
    return `${OPConstants.Storage.PUBLIC_SUBSCRIPTIONS_PREFIX}${String(userId)}`;
  }
}