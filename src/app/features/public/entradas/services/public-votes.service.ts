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
export class PublicVotesService {
  private readonly ids$ = new BehaviorSubject<Set<number>>(new Set<number>());
  private loadedKey: string | null = null;

  constructor(private tokenStorage: TokenStorageService) {}

  observeIds() {
    return this.ids$.asObservable();
  }

  hasVoted(idEntrada: number | null | undefined): boolean {
    if (!idEntrada) return false;
    this.ensureLoaded();
    return this.ids$.value.has(idEntrada);
  }

  addVote(entrada: PublicBookmark): void {
    this.ensureLoaded();
    const id = Number(entrada?.idEntrada);
    if (!Number.isFinite(id) || id <= 0) return;
    
    const ids = new Set(this.ids$.value);
    if (ids.has(id)) return; // Ya votado

    const list = this.getVotes();
    ids.add(id);
    list.unshift(entrada);
    
    this.ids$.next(ids);
    this.saveVotes(list);
  }

  removeVote(idEntrada: number): void {
    this.ensureLoaded();
    const id = Number(idEntrada);
    if (!Number.isFinite(id) || id <= 0) return;
    
    const ids = new Set(this.ids$.value);
    const list = this.getVotes();
    const idx = list.findIndex((b) => Number(b.idEntrada) === id);

    if (ids.has(id)) {
      ids.delete(id);
      if (idx >= 0) list.splice(idx, 1);
      this.ids$.next(ids);
      this.saveVotes(list);
    }
  }

  clearAll(): void {
    this.ensureLoaded();
    this.ids$.next(new Set<number>());
    this.saveVotes([]);
  }

  getVotes(): PublicBookmark[] {
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
    this.getVotes().forEach((b) => {
      const id = Number((b as any)?.idEntrada);
      if (Number.isFinite(id) && id > 0) ids.add(id);
    });
    this.ids$.next(ids);
  }

  private saveVotes(list: PublicBookmark[]): void {
    const key = this.getStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(list.slice(0, 200)));
  }

  private getStorageKey(): string | null {
    const user = this.tokenStorage.getUser();
    if (!user) return null;
    
    // Buscar cualquier propiedad que pueda ser el ID del usuario
    const userId = user.idUsuario ?? user.id ?? user.userId ?? user.username ?? null;
    
    if (!userId) return null;
    return `${OPConstants.Storage.PUBLIC_VOTES_PREFIX}${String(userId)}`;
  }
}

