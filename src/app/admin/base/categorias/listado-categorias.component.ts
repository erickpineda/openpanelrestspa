import { Component, OnInit } from "@angular/core";
import { finalize } from 'rxjs/operators';
import { Router } from "@angular/router";
import { Categoria } from "../../../core/models/categoria.model";
import { CategoriaService } from "../../../core/services/data/categoria.service";
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
  filteredCategorias: Categoria[] = [];
  pagedCategorias: Categoria[] = [];

  constructor(
    private router: Router,
    private categoriaService: CategoriaService,
    private log: LoggerService
  ) {}

  ngOnInit(): void {
    this.obtenerListaCategorias();
  }

  obtenerListaCategorias(): void {
    this.cargando = true;
    this.errorMsg = null;
    this.categoriaService.listarSinGlobalLoader()
      .pipe(finalize(() => { this.cargando = false; }))
      .subscribe({
      next: (response: any) => {
        const categorias: Categoria[] = Array.isArray(response) ? response : [];
        this.listaCategorias = categorias;
        this.totalElements = categorias.length;
        this.search();
      },
      error: (err: any) => {
        if (err?.status === 404) {
          this.listaCategorias = [];
          this.errorMsg = 'No se encontraron categorías.';
        } else {
          this.errorMsg = 'Error al cargar categorías.';
          this.log.error('Error al cargar categorías:', err);
        }
      }
    });
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
  onBasicSearchTextChange(text: string): void { this.basicSearchText = text || ''; this.pageNo = 0; this.search(); }
  onPageSizeChange(size: number): void { this.pageSize = Number(size) || 10; this.pageNo = 0; this.updatePage(); }

  search(): void {
    const term = (this.basicSearchText || '').toLowerCase();
    const adv = (this.filtroNombre || '').toLowerCase();
    const base = this.listaCategorias || [];
    this.filteredCategorias = base.filter(c => {
      const nombre = (c.nombre || '').toLowerCase();
      const matchBasic = !term || nombre.includes(term);
      const matchAdv = !adv || nombre.includes(adv);
      return matchBasic && matchAdv;
    });
    this.totalElements = this.filteredCategorias.length;
    this.pageNo = 0;
    this.updatePage();
  }

  reset(): void {
    this.basicSearchText = '';
    this.filtroNombre = '';
    this.pageNo = 0;
    this.search();
  }

  prev(): void { if (this.pageNo > 0) { this.pageNo--; this.updatePage(); } }
  next(): void { if (this.pageNo < this.getTotalPages() - 1) { this.pageNo++; this.updatePage(); } }
  getTotalPages(): number { return Math.max(1, Math.ceil(this.totalElements / this.pageSize)); }

  private updatePage(): void {
    const start = this.pageNo * this.pageSize;
    const end = start + this.pageSize;
    this.pagedCategorias = this.filteredCategorias.slice(start, end);
  }
}
