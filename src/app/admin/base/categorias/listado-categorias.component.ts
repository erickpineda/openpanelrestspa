import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { finalize, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Categoria } from '../../../core/models/categoria.model';
import { CategoriaService } from '../../../core/services/data/categoria.service';
import { SearchUtilService } from '../../../core/services/utils/search-util.service';
import { LoggerService } from '../../../core/services/logger.service';
import { PaginaResponse } from '../../../core/models/pagina-response.model';
import { ToastService } from '../../../core/services/ui/toast.service';
import { CategoriaFacadeService } from './categoria-form/srv/categoria-facade.service';
import { CategoriaFormComponent } from './categoria-form/categoria-form.component';
import { DashboardFacadeService } from '../dashboard/srv/dashboard-facade.service';
import { TopItemDTO } from '../../../shared/models/dashboard.models';

@Component({
  selector: 'app-listado-categorias',
  templateUrl: './listado-categorias.component.html',
  styleUrls: ['./listado-categorias.component.scss'],
  standalone: false,
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

  // Modal Crear/Editar
  visibleModalCrear = false;
  visibleModalEditar = false;
  categoriaSeleccionada?: Categoria;

  // Stats
  categoryStats: Map<string, number> = new Map();

  // @ViewChild(CategoriaFormComponent) categoriaForm?: CategoriaFormComponent;

  constructor(
    private router: Router,
    private categoriaService: CategoriaService,
    private facade: CategoriaFacadeService,
    private dashboardFacade: DashboardFacadeService,
    private log: LoggerService,
    private searchUtil: SearchUtilService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadStats();
    this.obtenerListaCategorias();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats(): void {
    // Intentamos obtener un número grande de top categorías para cubrir la mayoría
    this.dashboardFacade.getTop('categories', 500, true).subscribe({
      next: (items: TopItemDTO[]) => {
        if (items && items.length > 0) {
          this.categoryStats.clear();
          items.forEach((item) => {
            if (item.name) {
              this.categoryStats.set(item.name.toLowerCase(), item.count || 0);
            }
          });
          // Si ya tenemos categorías cargadas, aplicamos los stats
          if (this.listaCategorias.length > 0) {
            this.applyStats();
          }
        }
      },
      error: (err) => {
        this.log.error('Error cargando stats de categorías', err);
      },
    });
  }

  applyStats(): void {
    if (this.categoryStats.size === 0) return;

    const updateList = (list: Categoria[]) => {
      let changed = false;
      const newList = list.map((cat) => {
        const count = this.categoryStats.get((cat.nombre || '').toLowerCase());
        if (count !== undefined && cat.cantidadEntradas !== count) {
          changed = true;
          return { ...cat, cantidadEntradas: count };
        }
        return cat;
      });
      return changed ? newList : list;
    };

    // Actualizamos listaCategorias y pagedCategorias
    const newLista = updateList(this.listaCategorias);
    if (newLista !== this.listaCategorias) {
      this.listaCategorias = newLista;
    }

    const newPaged = updateList(this.pagedCategorias);
    if (newPaged !== this.pagedCategorias) {
      this.pagedCategorias = newPaged;
    }

    // Actualizamos allCategorias si existe (paginación cliente)
    if (this.allCategorias.length > 0) {
      const newAll = updateList(this.allCategorias);
      if (newAll !== this.allCategorias) {
        this.allCategorias = newAll;
      }
    }

    // Forzar detección de cambios si hubo cambios
    this.cdr.detectChanges();
  }

  obtenerListaCategorias(): void {
    this.cargando = true;
    this.errorMsg = null;
    const hasFilters = !!(this.basicSearchText || this.filtroNombre);
    if (!hasFilters) {
      this.categoriaService
        .listarPaginaSinGlobalLoader(this.pageNo, this.pageSize)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.cargando = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (response: any) => {
            const data = response?.data || response;
            this.setPageData(data);
          },
          error: (err: any) => this.handleError(err),
        });
    } else {
      const value = this.basicSearchText || this.filtroNombre || '';
      const payload = this.searchUtil.buildSingle('Categoria', 'nombre', value, 'CONTAINS', 'AND');
      this.categoriaService
        .buscarSinGlobalLoader(payload, this.pageNo, this.pageSize)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.cargando = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (data: any) => {
            this.setPageData(data);
          },
          error: (err: any) => this.handleError(err),
        });
    }
  }

  private setPageData(data: any): void {
    const raw = data?.elements ?? (Array.isArray(data) ? data : []);
    const elementos: Categoria[] = Array.isArray(raw) ? raw : [];

    const hasServerPaging =
      typeof data?.totalPages === 'number' || typeof data?.totalElements === 'number';

    if (hasServerPaging) {
      this.listaCategorias = elementos;
      this.allCategorias = [];
      this.totalElements = Number(data?.totalElements || elementos.length || 0);
      this.totalPages = Number(
        data?.totalPages || Math.ceil(this.totalElements / this.pageSize) || 1
      );
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
    this.applyStats();
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
    this.categoriaSeleccionada = undefined;
    this.visibleModalCrear = true;
  }

  editarCategoria(id: number): void {
    this.cargando = true;
    this.facade.obtenerCategoriaPorId(id).subscribe({
      next: (cat) => {
        this.cargando = false;
        if (cat) {
          this.categoriaSeleccionada = cat;
          this.visibleModalEditar = true;
        } else {
          this.toastService.showError('No se pudo cargar la categoría', 'Error');
        }
      },
      error: (err) => {
        this.cargando = false;
        this.log.error('Error al cargar categoría para edición', err);
        this.toastService.showError('Error al cargar la categoría', 'Error');
      }
    });
  }

  cerrarModalCrear(): void {
    this.visibleModalCrear = false;
  }

  cerrarModalEditar(): void {
    this.visibleModalEditar = false;
    this.categoriaSeleccionada = undefined;
  }



  borrarCategoria(categ: Categoria): void {
    if (!categ?.idCategoria) return;
    this.categoriaToDelete = categ;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.categoriaToDelete?.idCategoria) {
      this.showDeleteModal = false;
      return;
    }

    this.cargando = true;
    this.categoriaService
      .borrar(this.categoriaToDelete.idCategoria)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
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
        },
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
  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }
  onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text || '';
    this.pageNo = 0;
    this.obtenerListaCategorias();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size) || 10;
    this.pageNo = 0;

    // Si tenemos datos locales completos, repaginar localmente para evitar llamada innecesaria (opcional, pero seguro llamar API)
    // Por consistencia llamamos a obtenerListaCategorias que decidirá
    this.obtenerListaCategorias();
  }

  search(): void {
    this.pageNo = 0;
    this.obtenerListaCategorias();
  }

  reset(): void {
    this.basicSearchText = '';
    this.filtroNombre = '';
    this.pageNo = 0;
    this.obtenerListaCategorias();
  }

  onPageChange(page: number): void {
    const totalPages = this.getTotalPages();
    const safePage = Math.max(0, Math.min(Number(page) || 0, Math.max(0, totalPages - 1)));
    if (safePage === this.pageNo) return;
    this.pageNo = safePage;
    if (this.allCategorias.length > 0) {
      this.applyPaging();
      return;
    }
    this.obtenerListaCategorias();
  }

  getTotalPages(): number {
    return Math.max(1, this.totalPages);
  }
}
