import { Component, OnInit } from '@angular/core';
import { PublicEntradasFacadeService } from '../../services/public-entradas-facade.service';
import { parseAllowedDate } from '@shared/utils/date-utils';
import { CategoriaService } from '@app/core/services/data/categoria.service';
import { AnalyticsService } from '@app/core/services/analytics/analytics.service';
import { PublicBookmarksService } from '../../services/public-bookmarks.service';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-listado-entradas-public',
  templateUrl: './listado-entradas-public.component.html',
  styleUrls: ['./listado-entradas-public.component.scss'],
  standalone: false,
})
export class ListadoEntradasPublicComponent implements OnInit {
  entradas$ = this.facade.entradas$;
  loading$ = this.facade.loading$;
  totalPages$ = this.facade.totalPages$;

  currentPage = 1;
  pageSize = 10;
  searchText = '';
  sortField: string = 'fechaPublicacion';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  filterAllowComments = false;
  categoriasSeleccionadas: string[] = [];
  categoriasPopulares: string[] = [];
  filtersVisible = false;
  bookmarkedSlugs = new Set<string>();

  constructor(
    private facade: PublicEntradasFacadeService,
    private categoriaService: CategoriaService,
    private analytics: AnalyticsService,
    private bookmarksService: PublicBookmarksService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarCategoriasPopulares();
    this.route.queryParamMap
      .pipe(
        map((pm) => ({
          q: (pm.get('q') ?? '').trim(),
          categoria: (pm.get('categoria') ?? '').trim(),
        })),
        distinctUntilChanged((a, b) => a.q === b.q && a.categoria === b.categoria)
      )
      .subscribe(({ q, categoria }) => {
        if (q) this.searchText = q;
        if (categoria) this.categoriasSeleccionadas = [categoria];
        if (q || categoria) this.currentPage = 1;
        this.cargarPagina();
      });
    
    this.bookmarksService.observeSlugs().subscribe(slugs => {
      this.bookmarkedSlugs = slugs;
    });
  }

  isBookmarked(slug: string): boolean {
    return this.bookmarkedSlugs.has(slug);
  }

  cargarCategoriasPopulares() {
    this.categoriaService
      .listarPaginaSinGlobalLoader(0, 50, 'cantidadEntradas', 'DESC')
      .subscribe({
        next: (res: any) => {
          const data = res?.data || res;
          const elements = Array.isArray(data?.elements) ? data.elements : [];
          this.categoriasPopulares = elements
            .map((c: any) => c?.nombre)
            .filter((n: any) => typeof n === 'string' && n.trim().length > 0)
            .slice(0, 8);
        },
        error: () => {
          this.categoriasPopulares = [];
        },
      });
  }

  cargarPagina(options?: { scrollToTop?: boolean }) {
    this.facade.buscarEntradasPublicas(
      this.currentPage - 1,
      this.pageSize,
      this.sortField,
      this.sortDirection,
      this.searchText,
      this.filterAllowComments ? true : undefined,
      this.categoriasSeleccionadas.length > 0 ? this.categoriasSeleccionadas : undefined
    );
    if (options?.scrollToTop !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  aplicarFiltros() {
    this.currentPage = 1;
    this.analytics.track('apply_filters', {
      context: 'public_entradas_list',
      searchText: this.searchText?.trim() || '',
      sortField: this.sortField,
      sortDirection: this.sortDirection,
      filterAllowComments: this.filterAllowComments,
      categorias: [...this.categoriasSeleccionadas],
    });
    this.cargarPagina({ scrollToTop: false });
  }

  onSearch(term: string): void {
    this.searchText = String(term ?? '');
    this.aplicarFiltros();
  }

  resetFiltros() {
    this.searchText = '';
    this.sortField = 'fechaPublicacion';
    this.sortDirection = 'DESC';
    this.filterAllowComments = false;
    this.categoriasSeleccionadas = [];
    this.currentPage = 1;
    this.analytics.track('reset_filters', { context: 'public_entradas_list' });
    this.cargarPagina({ scrollToTop: false });
  }

  toggleCategoria(categoria: string) {
    const index = this.categoriasSeleccionadas.indexOf(categoria);
    if (index > -1) {
      this.categoriasSeleccionadas.splice(index, 1);
    } else {
      this.categoriasSeleccionadas.push(categoria);
    }
    this.aplicarFiltros();
  }

  scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setSort(value: string) {
    if (value === 'votos_DESC') {
      this.sortField = 'votos';
      this.sortDirection = 'DESC';
      return;
    }
    if (value === 'cantidadComentarios_DESC') {
      this.sortField = 'cantidadComentarios';
      this.sortDirection = 'DESC';
      return;
    }
    if (value === 'fechaPublicacion_ASC') {
      this.sortField = 'fechaPublicacion';
      this.sortDirection = 'ASC';
      return;
    }
    this.sortField = 'fechaPublicacion';
    this.sortDirection = 'DESC';
  }

  getSortValue(): string {
    if (this.sortField === 'votos' && this.sortDirection === 'DESC') return 'votos_DESC';
    if (this.sortField === 'cantidadComentarios' && this.sortDirection === 'DESC') {
      return 'cantidadComentarios_DESC';
    }
    if (this.sortField === 'fechaPublicacion' && this.sortDirection === 'ASC') {
      return 'fechaPublicacion_ASC';
    }
    return 'fechaPublicacion_DESC';
  }

  getTopEntradas(entradas: any[] | null | undefined): any[] {
    const list = Array.isArray(entradas) ? [...entradas] : [];
    return list.sort((a, b) => Number(b?.votos ?? 0) - Number(a?.votos ?? 0)).slice(0, 3);
  }

  getCategoriasTop(entradas: any[] | null | undefined): string[] {
    const counts = new Map<string, number>();
    (Array.isArray(entradas) ? entradas : []).forEach((e) => {
      (Array.isArray(e?.categorias) ? e.categorias : []).forEach((c: any) => {
        const name = c?.nombre;
        if (!name) return;
        counts.set(name, (counts.get(name) || 0) + 1);
      });
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }

  nextPage() {
    this.currentPage++;
    this.cargarPagina();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cargarPagina();
    }
  }

  getFechaDate(fecha: any): Date | null {
    return parseAllowedDate(fecha);
  }
}
