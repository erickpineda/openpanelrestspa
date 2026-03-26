import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { PublicBookmarksService, PublicBookmark } from '../../../entradas/services/public-bookmarks.service';

@Component({
  selector: 'app-perfil-public',
  templateUrl: './perfil-public.component.html',
  styleUrls: ['./perfil-public.component.scss'],
  standalone: false,
})
export class PerfilPublicComponent implements OnInit {
  user: any;
  bookmarks: PublicBookmark[] = [];
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 5;
  itemsPerPageOptions = [5, 10, 20, 50];

  constructor(
    private tokenStorage: TokenStorageService,
    private bookmarksService: PublicBookmarksService
  ) {}

  ngOnInit(): void {
    this.user = this.tokenStorage.getUser();
    this.loadBookmarks();
  }

  loadBookmarks(): void {
    this.bookmarks = this.bookmarksService.getBookmarks();
    this.checkPagination();
  }

  get paginatedBookmarks(): PublicBookmark[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.bookmarks.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.bookmarks.length / this.itemsPerPage);
  }

  changePage(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  changeItemsPerPage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(select.value);
    this.currentPage = 1;
  }

  private checkPagination(): void {
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
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
}
