import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { OPConstants } from '@shared/constants/op-global.constants';

export type PublicBookmark = {
  idEntrada: number;
  slug?: string | null;
  titulo?: string | null;
  resumen?: string | null;
  fechaPublicacion?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class PublicHistoryService {
  private readonly ids$ = new BehaviorSubject<Set<number>>(new Set<number>());
  private loadedKey: string | null = null;
  private readonly MAX_HISTORY = 20;

  constructor(private tokenStorage: TokenStorageService) {}

  observeIds() {
    return this.ids$.asObservable();
  }

  addEntry(entrada: PublicBookmark): void {
    this.ensureLoaded();
    const id = Number(entrada?.idEntrada);
    if (!Number.isFinite(id) || id <= 0) return;
    
    const ids = new Set(this.ids$.value);
    const list = this.getHistory();
    const idx = list.findIndex((b) => Number(b.idEntrada) === id);

    if (idx >= 0) {
      list.splice(idx, 1);
    }
    
    ids.add(id);
    list.unshift(entrada);
    
    if (list.length > this.MAX_HISTORY) {
      const removed = list.pop();
      if (removed) ids.delete(Number(removed.idEntrada));
    }
    
    this.ids$.next(ids);
    this.saveHistory(list);
  }

  remove(idEntrada: number): void {
    this.ensureLoaded();
    const id = Number(idEntrada);
    if (!Number.isFinite(id) || id <= 0) return;
    
    const ids = new Set(this.ids$.value);
    const list = this.getHistory();
    const idx = list.findIndex((b) => Number(b.idEntrada) === id);

    if (ids.has(id)) {
      ids.delete(id);
      if (idx >= 0) list.splice(idx, 1);
      this.ids$.next(ids);
      this.saveHistory(list);
    }
  }

  clearAll(): void {
    this.ensureLoaded();
    this.ids$.next(new Set<number>());
    this.saveHistory([]);
  }

  getHistory(): PublicBookmark[] {
    const key = this.getStorageKey();
    if (!key) return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private ensureLoaded(): void {
    const key = this.getStorageKey();
    if (!key) {
      this.loadedKey = null;
      this.ids$.next(new Set<number>());
      return;
    }
    if (this.loadedKey === key) return;
    this.loadedKey = key;
    const ids = new Set<number>();
    this.getHistory().forEach((b) => {
      const id = Number((b as any)?.idEntrada);
      if (Number.isFinite(id) && id > 0) ids.add(id);
    });
    this.ids$.next(ids);
  }

  private saveHistory(list: PublicBookmark[]): void {
    const key = this.getStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(list));
  }

  private getStorageKey(): string | null {
    const user = this.tokenStorage.getUser();
    if (!user) return null;
    
    const userId = user.idUsuario ?? user.id ?? user.userId ?? user.username ?? null;
    
    if (!userId) return null;
    return `${OPConstants.Storage.PUBLIC_HISTORY_PREFIX}${String(userId)}`;
  }
}

