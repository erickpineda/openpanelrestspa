import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { PublicBookmarksService, PublicBookmark } from '../../../entradas/services/public-bookmarks.service';
import { PublicVotesService } from '../../../entradas/services/public-votes.service';
import { PublicHistoryService } from '../../../entradas/services/public-history.service';
import { PublicSubscriptionsService, UserSubscriptions } from '../../../services/public-subscriptions.service';
import { ReaderPreferencesService, ReaderPreferences } from '../../../services/reader-preferences.service';
import { CategoriaService } from '@app/core/services/data/categoria.service';
import { EtiquetaService } from '@app/core/services/data/etiqueta.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

type PublicHistoryEntry = {
  idEntrada: number;
  slug: string;
  titulo: string | null;
  resumen: string | null;
  fechaPublicacion: string | null;
};

type SubscriptionItem = {
  codigo: string;
  nombre: string;
};

@Component({
  selector: 'app-perfil-public',
  templateUrl: './perfil-public.component.html',
  styleUrls: ['./perfil-public.component.scss'],
  standalone: false,
})
export class PerfilPublicComponent implements OnInit {
  user: any;
  bookmarks: PublicBookmark[] = [];
  votes: PublicBookmark[] = [];
  history: PublicHistoryEntry[] = [];
  
  // Paginación Bookmarks
  currentPage = 1;
  itemsPerPage = 5;
  itemsPerPageOptions = [5, 10, 20, 50];

  // Paginación Votos
  votesCurrentPage = 1;
  votesItemsPerPage = 5;

  // Paginación History
  historyCurrentPage = 1;
  historyItemsPerPage = 5;

  // Preferencias
  readerPrefs: ReaderPreferences = { fontSize: 'normal', theme: 'auto' };
  
  // Suscripciones
  subscriptions: UserSubscriptions = { categorias: [], etiquetas: [] };
  categoriasSeguidas: SubscriptionItem[] = [];
  etiquetasSeguidas: SubscriptionItem[] = [];
  private categoriaCodigoToNombre = new Map<string, string>();
  private etiquetaCodigoToNombre = new Map<string, string>();

  constructor(
    private tokenStorage: TokenStorageService,
    private bookmarksService: PublicBookmarksService,
    private votesService: PublicVotesService,
    private historyService: PublicHistoryService,
    private prefsService: ReaderPreferencesService,
    private subsService: PublicSubscriptionsService,
    private categoriaService: CategoriaService,
    private etiquetaService: EtiquetaService
  ) {}

  ngOnInit(): void {
    this.user = this.tokenStorage.getUser();
    this.loadBookmarks();
    this.loadVotes();
    this.loadHistory();
    
    this.prefsService.getPreferences().subscribe(prefs => {
      this.readerPrefs = prefs;
    });

    this.subsService.observeSubscriptions().subscribe(subs => {
      this.subscriptions = subs;
      this.resolveSubscriptionNames(subs);
    });
  }

  loadBookmarks(): void {
    this.bookmarksService.getBookmarks().subscribe(bookmarks => {
      this.bookmarks = bookmarks;
      this.checkPagination();
    });
  }

  loadVotes(): void {
    this.votesService.getVotes().subscribe(votes => {
      this.votes = votes;
      this.checkVotesPagination();
    });
  }

  loadHistory(): void {
    const raw = this.historyService.getHistory();
    this.history = raw
      .filter((h) => Number.isFinite(Number((h as any)?.idEntrada)) && !!(h as any)?.slug)
      .map((h: any) => ({
        idEntrada: Number(h.idEntrada),
        slug: String(h.slug),
        titulo: h.titulo ?? null,
        resumen: h.resumen ?? null,
        fechaPublicacion: typeof h.fechaPublicacion === 'string' ? h.fechaPublicacion : null,
      }));
    this.checkHistoryPagination();
  }

  get paginatedBookmarks(): PublicBookmark[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.bookmarks.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.bookmarks.length / this.itemsPerPage);
  }

  get paginatedVotes(): PublicBookmark[] {
    const start = (this.votesCurrentPage - 1) * this.votesItemsPerPage;
    return this.votes.slice(start, start + this.votesItemsPerPage);
  }

  get votesTotalPages(): number {
    return Math.ceil(this.votes.length / this.votesItemsPerPage);
  }

  get paginatedHistory(): PublicHistoryEntry[] {
    const start = (this.historyCurrentPage - 1) * this.historyItemsPerPage;
    return this.history.slice(start, start + this.historyItemsPerPage);
  }

  get historyTotalPages(): number {
    return Math.ceil(this.history.length / this.historyItemsPerPage);
  }

  changePage(page: number, event?: Event): void {
    if (event) event.preventDefault();
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  changeVotesPage(page: number, event?: Event): void {
    if (event) event.preventDefault();
    if (page >= 1 && page <= this.votesTotalPages) {
      this.votesCurrentPage = page;
    }
  }

  changeHistoryPage(page: number, event?: Event): void {
    if (event) event.preventDefault();
    if (page >= 1 && page <= this.historyTotalPages) {
      this.historyCurrentPage = page;
    }
  }

  changeItemsPerPage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(select.value);
    this.currentPage = 1;
  }

  changeVotesItemsPerPage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.votesItemsPerPage = Number(select.value);
    this.votesCurrentPage = 1;
  }

  changeHistoryItemsPerPage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.historyItemsPerPage = Number(select.value);
    this.historyCurrentPage = 1;
  }

  private checkPagination(): void {
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  private checkVotesPagination(): void {
    if (this.votesCurrentPage > this.votesTotalPages && this.votesTotalPages > 0) {
      this.votesCurrentPage = this.votesTotalPages;
    }
  }

  private checkHistoryPagination(): void {
    if (this.historyCurrentPage > this.historyTotalPages && this.historyTotalPages > 0) {
      this.historyCurrentPage = this.historyTotalPages;
    }
  }

  removeBookmark(slug: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.bookmarksService.remove(slug);
    // UI Optimista: quitar del array local inmediatamente
    this.bookmarks = this.bookmarks.filter(b => b.slug !== slug);
    this.checkPagination();
  }

  clearAllBookmarks(): void {
    if (confirm('¿Estás seguro de que deseas eliminar todas las entradas guardadas?')) {
      this.bookmarksService.clearAll();
      this.bookmarks = [];
      this.checkPagination();
    }
  }

  removeVote(slug: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.votesService.removeVote(slug);
    this.votes = this.votes.filter(v => v.slug !== slug);
    this.checkVotesPagination();
  }

  clearAllVotes(): void {
    if (confirm('¿Estás seguro de que deseas eliminar todos tus "Me gusta"?')) {
      this.votesService.clearAll();
      this.votes = [];
      this.checkVotesPagination();
    }
  }

  removeHistory(idEntrada: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.historyService.remove(idEntrada);
    this.loadHistory();
  }

  clearAllHistory(): void {
    if (confirm('¿Estás seguro de que deseas borrar tu historial de lectura?')) {
      this.historyService.clearAll();
      this.loadHistory();
    }
  }

  updateTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.prefsService.updatePreferences({ theme });
  }

  updateFontSize(fontSize: 'small' | 'normal' | 'large'): void {
    this.prefsService.updatePreferences({ fontSize });
  }

  unsubCategoria(cat: string): void {
    this.subsService.toggleCategoria(cat);
  }

  unsubEtiqueta(tag: string): void {
    this.subsService.toggleEtiqueta(tag);
  }

  private resolveSubscriptionNames(subs: UserSubscriptions): void {
    const categorias = Array.isArray(subs?.categorias) ? subs.categorias : [];
    const etiquetas = Array.isArray(subs?.etiquetas) ? subs.etiquetas : [];

    if (categorias.length === 0) this.categoriasSeguidas = [];
    if (etiquetas.length === 0) this.etiquetasSeguidas = [];

    const catRequests = categorias.map((codigo) => {
      const cached = this.categoriaCodigoToNombre.get(codigo);
      if (cached) return of({ codigo, nombre: cached });
      return this.categoriaService.obtenerPorCodigo(codigo).pipe(
        map((r: any) => r?.data ?? r),
        map((c: any) => {
          const nombre = String(c?.nombre ?? codigo).trim() || codigo;
          this.categoriaCodigoToNombre.set(codigo, nombre);
          return { codigo, nombre };
        }),
        catchError(() => of({ codigo, nombre: codigo }))
      );
    });

    const tagRequests = etiquetas.map((codigo) => {
      const cached = this.etiquetaCodigoToNombre.get(codigo);
      if (cached) return of({ codigo, nombre: cached });
      return this.etiquetaService.obtenerPorCodigo(codigo).pipe(
        map((r: any) => r?.data ?? r),
        map((t: any) => {
          const nombre = String(t?.nombre ?? codigo).trim() || codigo;
          this.etiquetaCodigoToNombre.set(codigo, nombre);
          return { codigo, nombre };
        }),
        catchError(() => of({ codigo, nombre: codigo }))
      );
    });

    if (catRequests.length > 0) {
      forkJoin(catRequests).subscribe((items) => {
        this.categoriasSeguidas = items;
      });
    }
    if (tagRequests.length > 0) {
      forkJoin(tagRequests).subscribe((items) => {
        this.etiquetasSeguidas = items;
      });
    }
  }
}
