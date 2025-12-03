import { Component, OnInit } from "@angular/core";
import { finalize } from 'rxjs/operators';
import { Router } from "@angular/router";
import { Categoria } from "../../../core/models/categoria.model";
import { CategoriaService } from "../../../core/services/data/categoria.service";
import { SearchUtilService } from "../../../core/services/utils/search-util.service";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
  selector: 'app-listado-categorias',
  templateUrl: './listado-categorias.component.html',
  styleUrls: ['./listado-categorias.component.scss']
})
export class ListadoCategoriasComponent implements OnInit {
  listaCategorias: Categoria[] = [];
  cargando = false;
  errorMsg: string | null = null;

  // Patrón de toolbar/búsqueda/paginación
  basicSearchText: string = '';
  showAdvanced: boolean = false;
  filtroNombre: string = '';
  pageSize: number = 10;
  pageNo: number = 0;
  totalElements: number = 0;
  totalPages: number = 1;
  pagedCategorias: Categoria[] = [];

  constructor(
    private router: Router,
    private categoriaService: CategoriaService,
    private log: LoggerService,
    private searchUtil: SearchUtilService
  ) {}

  ngOnInit(): void {
    this.obtenerListaCategorias();
  }

  obtenerListaCategorias(): void {
    this.cargando = true;
    this.errorMsg = null;
    const hasFilters = !!(this.basicSearchText || this.filtroNombre);
    if (!hasFilters) {
      this.categoriaService.listarPagina(this.pageNo, this.pageSize)
        .pipe(finalize(() => { this.cargando = false; }))
        .subscribe({
          next: (response: any) => {
            const data = response?.data || response;
            const elementos: Categoria[] = Array.isArray(data?.elements) ? data.elements : (Array.isArray(data) ? data : []);
            this.listaCategorias = elementos;
            this.pagedCategorias = elementos;
            this.totalElements = Number(data?.totalElements || elementos.length || 0);
            this.totalPages = Number(data?.totalPages || Math.max(1, Math.ceil(this.totalElements / this.pageSize)));
          },
          error: (err: any) => {
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
          }
        });
    } else {
      const value = this.basicSearchText || this.filtroNombre || '';
      const payload = this.searchUtil.buildSingle('Categoria', 'nombre', value, 'CONTAINS', 'AND');
      this.categoriaService.buscarSafe(payload, this.pageNo, this.pageSize)
        .pipe(finalize(() => { this.cargando = false; }))
        .subscribe({
          next: (data: any) => {
            const elementos: Categoria[] = Array.isArray(data?.elements) ? data.elements : [];
            this.listaCategorias = elementos;
            this.pagedCategorias = elementos;
            this.totalElements = Number(data?.totalElements || elementos.length || 0);
            this.totalPages = Number(data?.totalPages || Math.max(1, Math.ceil(this.totalElements / this.pageSize)));
          },
          error: (err: any) => {
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
          }
        });
    }
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

  borrarCategoria(id: number): void {
    // Aquí podrías abrir un modal de confirmación y luego llamar al servicio para borrar
    // this.categoriaService.borrar(id).subscribe(...)
    alert('Funcionalidad de borrado no implementada');
  }

  trackByCategoriaId(index: number, categoria: Categoria): number {
    return categoria.idCategoria;
  }

  // ===== Toolbar / Búsqueda / Paginación =====
  toggleAdvanced(): void { this.showAdvanced = !this.showAdvanced; }
  onBasicSearchTextChange(text: string): void { this.basicSearchText = text || ''; this.pageNo = 0; this.obtenerListaCategorias(); }
  onPageSizeChange(size: number): void { this.pageSize = Number(size) || 10; this.pageNo = 0; this.obtenerListaCategorias(); }

  search(): void { this.pageNo = 0; this.obtenerListaCategorias(); }

  reset(): void {
    this.basicSearchText = '';
    this.filtroNombre = '';
    this.pageNo = 0;
    this.obtenerListaCategorias();
  }

  prev(): void { if (this.pageNo > 0) { this.pageNo--; this.obtenerListaCategorias(); } }
  next(): void { if (this.pageNo < this.getTotalPages() - 1) { this.pageNo++; this.obtenerListaCategorias(); } }
  getTotalPages(): number { return Math.max(1, this.totalPages); }
}
