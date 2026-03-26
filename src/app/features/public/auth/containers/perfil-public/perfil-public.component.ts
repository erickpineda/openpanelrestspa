import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { PublicBookmarksService, PublicBookmark } from '../../../entradas/services/public-bookmarks.service';
import { PublicVotesService } from '../../../entradas/services/public-votes.service';
import { PublicHistoryService } from '../../../entradas/services/public-history.service';
import { PublicSubscriptionsService, UserSubscriptions } from '../../../services/public-subscriptions.service';
import { ReaderPreferencesService, ReaderPreferences } from '../../../services/reader-preferences.service';

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
  history: PublicBookmark[] = [];
  
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

  constructor(
    private tokenStorage: TokenStorageService,
    private bookmarksService: PublicBookmarksService,
    private votesService: PublicVotesService,
    private historyService: PublicHistoryService,
    private prefsService: ReaderPreferencesService,
    private subsService: PublicSubscriptionsService
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
    });
  }

  loadBookmarks(): void {
    this.bookmarks = this.bookmarksService.getBookmarks();
    this.checkPagination();
  }

  loadVotes(): void {
    this.votes = this.votesService.getVotes();
    this.checkVotesPagination();
  }

  loadHistory(): void {
    this.history = this.historyService.getHistory();
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

  get paginatedHistory(): PublicBookmark[] {
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

  removeBookmark(idEntrada: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.bookmarksService.remove(idEntrada);
    this.loadBookmarks();
  }

  clearAllBookmarks(): void {
    if (confirm('¿Estás seguro de que deseas eliminar todas las entradas guardadas?')) {
      this.bookmarksService.clearAll();
      this.loadBookmarks();
    }
  }

  removeVote(idEntrada: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.votesService.removeVote(idEntrada);
    this.loadVotes();
  }

  clearAllVotes(): void {
    if (confirm('¿Estás seguro de que deseas eliminar todos tus "Me gusta"?')) {
      this.votesService.clearAll();
      this.loadVotes();
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
}
