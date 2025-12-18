import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { finalize, takeUntil } from 'rxjs/operators';
import { Router } from "@angular/router";
import { Subject } from 'rxjs';
import { Categoria } from "../../../core/models/categoria.model";
import { CategoriaService } from "../../../core/services/data/categoria.service";
import { SearchUtilService } from "../../../core/services/utils/search-util.service";
import { LoggerService } from "../../../core/services/logger.service";
import { PaginaResponse } from "../../../core/models/pagina-response.model";

@Component({
    selector: 'app-listado-categorias',
    templateUrl: './listado-categorias.component.html',
    styleUrls: ['./listado-categorias.component.scss'],
    standalone: false
})
export class ListadoCategoriasComponent implements OnInit, OnDestroy {
  listaCategorias: Categoria[] = [];
  cargando = false;
  errorMsg: string | null = null;

  private destroy$ = new Subject<void>();

  // Patrón de toolbar/búsqueda/paginación
  basicSearchText: string = '';
  showAdvanced: boolean = false;
  filtroNombre: string = '';
  pageSize: number = 10;
  pageNo: number = 0;
  totalElements: number = 0;
  totalPages: number = 1;
  pagedCategorias: Categoria[] = [];
  allCategorias: Categoria[] = []; // Para paginación cliente
  numberOfElements: number = 0;

  showDeleteModal = false;
  categoriaToDelete: Categoria | null = null;

  constructor(
    private router: Router,
    private categoriaService: CategoriaService,
    private log: LoggerService,
    private searchUtil: SearchUtilService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.obtenerListaCategorias();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  obtenerListaCategorias(): void {
    this.cargando = true;
    this.errorMsg = null;
    const hasFilters = !!(this.basicSearchText || this.filtroNombre);
    if (!hasFilters) {
      this.categoriaService.listarPaginaSinGlobalLoader(this.pageNo, this.pageSize)
        .pipe(takeUntil(this.destroy$), finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
        .subscribe({
          next: (response: any) => {
            const data = response?.data || response;
            this.setPageData(data);
          },
          error: (err: any) => this.handleError(err)
        });
    } else {
      const value = this.basicSearchText || this.filtroNombre || '';
      const payload = this.searchUtil.buildSingle('Categoria', 'nombre', value, 'CONTAINS', 'AND');
      this.categoriaService.buscarSinGlobalLoader(payload, this.pageNo, this.pageSize)
        .pipe(takeUntil(this.destroy$), finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
        .subscribe({
          next: (data: any) => {
            this.setPageData(data);
          },
          error: (err: any) => this.handleError(err)
        });
    }
  }

  private setPageData(data: any): void {
    const raw = (data?.elements ?? (Array.isArray(data) ? data : []));
    const elementos: Categoria[] = Array.isArray(raw) ? raw : [];
    
    const hasServerPaging = typeof data?.totalPages === 'number' || typeof data?.totalElements === 'number';

    if (hasServerPaging) {
      this.listaCategorias = elementos;
      this.totalElements = Number(data?.totalElements || elementos.length || 0);
      this.totalPages = Number(data?.totalPages || Math.ceil(this.totalElements / this.pageSize) || 1);
      this.numberOfElements = Number(data?.numberOfElements ?? elementos.length);
      this.pagedCategorias = elementos;
      
      // Si estamos en una página vacía y hay páginas anteriores, volver atrás
      if (elementos.length === 0 && this.pageNo > 0 && this.pageNo >= this.totalPages) {
        this.pageNo = Math.max(0, this.totalPages - 1);
        this.obtenerListaCategorias();
        return;
      }
    } else {
      // Fallback paginación cliente
      this.allCategorias = elementos;
      this.totalElements = this.allCategorias.length;
      this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));
      
      if (this.pageNo >= this.totalPages) {
        this.pageNo = Math.max(0, this.totalPages - 1);
      }
      
      this.applyPaging();
    }
    this.cdr.detectChanges();
  }

  private applyPaging(): void {
    if (this.allCategorias.length > 0) {
      const start = this.pageNo * this.pageSize;
      const end = start + this.pageSize;
      this.pagedCategorias = this.allCategorias.slice(start, end);
      this.numberOfElements = this.pagedCategorias.length;
      this.listaCategorias = this.pagedCategorias;
    } else {
        // Si no hay allCategorias (server paging), no hacemos nada o asumimos pagedCategorias ya seteado
    }
    this.cdr.detectChanges();
  }

  private handleError(err: any): void {
    if (err?.status === 404) {
      this.listaCategorias = [];
      this.pagedCategorias = [];
      this.totalElements = 0;
      this.totalPages = 1;
      this.errorMsg = 'No se encontraron categorías.';
    } else {
      this.errorMsg = 'Error al cargar categorías.';
      this.log.error('Error al cargar categorías:', err);
    }
    this.cdr.detectChanges();
  }

  refrescar(): void {
    this.obtenerListaCategorias();
  }

  crearCategoria(): void {
    this.router.navigate(['/admin/control/categorias/crear']);
  }

  editarCategoria(id: number): void {
    this.router.navigate(['/admin/control/categorias/editar', id]);
  }

  borrarCategoria(categ: Categoria): void {
    if (!categ?.idCategoria) return;
    this.categoriaToDelete = categ;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
      if (!this.categoriaToDelete?.idCategoria) {
          this.showDeleteModal = false;
          return;
      }
      
      this.cargando = true;
      this.categoriaService.borrar(this.categoriaToDelete.idCategoria)
          .pipe(takeUntil(this.destroy$), finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
          .subscribe({
              next: () => {
                  this.showDeleteModal = false;
                  this.categoriaToDelete = null;
                  this.obtenerListaCategorias();
              },
              error: (err: any) => {
                  this.log.error('categorias borrar', err);
                  this.errorMsg = 'Error al borrar la categoría';
                  this.showDeleteModal = false;
                  this.categoriaToDelete = null;
              }
          });
  }

  cancelDelete(): void {
      this.showDeleteModal = false;
      this.categoriaToDelete = null;
  }

  trackByCategoriaId(index: number, categoria: Categoria): number {
    return categoria.idCategoria;
  }

  // ===== Toolbar / Búsqueda / Paginación =====
  toggleAdvanced(): void { this.showAdvanced = !this.showAdvanced; }
  onBasicSearchTextChange(text: string): void { this.basicSearchText = text || ''; this.pageNo = 0; this.obtenerListaCategorias(); }
  
  onPageSizeChange(size: number): void { 
    this.pageSize = Number(size) || 10; 
    this.pageNo = 0; 
    
    // Si tenemos datos locales completos, repaginar localmente para evitar llamada innecesaria (opcional, pero seguro llamar API)
    // Por consistencia llamamos a obtenerListaCategorias que decidirá
    this.obtenerListaCategorias(); 
  }

  search(): void { this.pageNo = 0; this.obtenerListaCategorias(); }

  reset(): void {
    this.basicSearchText = '';
    this.filtroNombre = '';
    this.pageNo = 0;
    this.obtenerListaCategorias();
  }

  prev(): void { 
    if (this.pageNo > 0) { 
        this.pageNo--; 
        // Si tenemos allCategorias, paginamos local
        if (this.allCategorias.length > 0 && this.pagedCategorias.length !== this.totalElements) {
            this.applyPaging();
        } else {
            this.obtenerListaCategorias(); 
        }
    } 
  }
  
  next(): void { 
    if (this.pageNo < this.getTotalPages() - 1) { 
        this.pageNo++; 
        // Si tenemos allCategorias, paginamos local
        if (this.allCategorias.length > 0 && this.pagedCategorias.length !== this.totalElements) {
            this.applyPaging();
        } else {
            this.obtenerListaCategorias(); 
        }
    } 
  }
  
  getTotalPages(): number { return Math.max(1, this.totalPages); }
}
