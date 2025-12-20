import { DatePipe } from "@angular/common";
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { finalize, takeUntil } from 'rxjs/operators';
import { Router } from "@angular/router";
import { Subject } from 'rxjs';
import { Comentario } from "../../../core/models/comentario.model";
import { Entrada } from "../../../core/models/entrada.model";
import { PaginaResponse } from "../../../core/models/pagina-response.model";
import { Usuario } from "../../../core/models/usuario.model";
import { ComentarioService } from "../../../core/services/data/comentario.service";
import { EntradaService } from "../../../core/services/data/entrada.service";
import { UsuarioService } from "../../../core/services/data/usuario.service";
import { CommonFunctionalityService } from "../../../shared/services/common-functionality.service";
import { OpenpanelApiResponse } from "../../../core/models/openpanel-api-response.model";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
    selector: 'app-listado-comentarios',
    templateUrl: './listado-comentarios.component.html',
    styleUrls: ['./listado-comentarios.component.scss'],
    standalone: false
})

export class ListadoComentariosComponent implements OnInit, OnDestroy {

  listaComentarios: Comentario[] = [];

  // Patrón de toolbar/búsqueda/paginación
  basicSearchText: string = '';
  showAdvanced: boolean = false;
  filtroUsuario: string = '';
  filtroAprobado: boolean | null = null;
  filtroCuarentena: boolean | null = null;
  pageSize = 10;
  pageNo = 0;
  totalElements = 0;
  totalPages = 1;
  numberOfElements = 0;
  filteredComentarios: Comentario[] = [];
  pagedComentarios: Comentario[] = [];
  allComentarios: Comentario[] = []; // Para paginación cliente

  showDeleteModal = false;
  comentarioToDelete: Comentario | null = null;

  estaVacio: boolean = false;
  cargando: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private comentarioService: ComentarioService,
    private usuarioService: UsuarioService,
    private entradaService: EntradaService,
    private commonFuncService: CommonFunctionalityService,
    private log: LoggerService,
    private cdr: ChangeDetectorRef
  ) {
    
  }

  ngOnInit(): void {
    this.initList();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initList() {
    try {
      this.obtenerListaComentarios();
    } catch (error) {
      this.log.error("Error initializing list:", error);
    }
  }

  navigate(urlToNavigate: string) {
    this.router.navigate([urlToNavigate])
  }

  private async obtenerDatosUsuario(idUsuario: number): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      this.usuarioService.obtenerPorId(idUsuario).subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const usuario: Usuario = (response.data) ? response.data : Usuario;
          resolve(usuario)
        },
        error: (err: any) => {
          reject(err);
        }
      });
    });
  }

  private async obtenerDatosEntrada(idEntrada: number): Promise<Entrada> {
    return new Promise((resolve, reject) => {
      this.entradaService.obtenerPorId(idEntrada).subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const entrada: Entrada = (response.data) ? response.data.elements : Entrada;
          resolve(entrada)
        },
        error: (err: any) => {
          reject(err);
        }
      });
    });
  }

  private obtenerListaComentarios(): void {
    this.cargando = true;
    const hasFilters = this.hasActiveFilters();
    if (!hasFilters) {
      this.comentarioService.listarPaginaSinGlobalLoader(this.pageNo, this.pageSize)
        .pipe(takeUntil(this.destroy$), finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
        .subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const data: PaginaResponse = response?.data || new PaginaResponse();
          this.setPageData(data);
        },
        error: (err: any) => this.handlePageError(err)
      });
    } else {
      const payload: any = this.buildSearchPayload();
      this.comentarioService.buscarSinGlobalLoader(payload, this.pageNo, this.pageSize)
        .pipe(takeUntil(this.destroy$), finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
        .subscribe({
        next: (data: PaginaResponse) => {
          this.setPageData(data);
        },
        error: (err: any) => this.handlePageError(err)
      });
    }
  }

  public checkTrueOrFalseToString(toCheck: boolean) {
    return toCheck ? 'Si' : 'No';
  }

  truncateContent(content: string): string {
    return content.length > 20 ? content.substring(0, 20) + '...' : content;
  }

  // ===== Toolbar / Búsqueda / Paginación =====
  toggleAdvanced(): void { this.showAdvanced = !this.showAdvanced; }
  onBasicSearchTextChange(text: string): void { this.basicSearchText = text || ''; this.pageNo = 0; this.search(); }
  
  onPageSizeChange(size: number): void { 
    this.pageSize = Number(size) || 10; 
    this.pageNo = 0; 
    this.obtenerListaComentarios(); 
  }

  search(): void { this.pageNo = 0; this.obtenerListaComentarios(); }

  reset(): void {
    this.basicSearchText = '';
    this.filtroUsuario = '';
    this.filtroAprobado = null;
    this.filtroCuarentena = null;
    this.pageNo = 0;
    this.obtenerListaComentarios();
  }

  prev(): void { 
    if (this.pageNo > 0) { 
        this.onPageChange(this.pageNo - 1);
    } 
  }
  
  next(): void { 
    if (this.pageNo < this.totalPages - 1) { 
        this.onPageChange(this.pageNo + 1);
    } 
  }

  onPageChange(page: number): void {
    const totalPages = this.getTotalPages();
    const safePage = Math.max(0, Math.min(Number(page) || 0, Math.max(0, totalPages - 1)));
    if (safePage === this.pageNo) return;
    this.pageNo = safePage;
    if (this.allComentarios.length > 0) {
      this.applyPaging();
      return;
    }
    this.obtenerListaComentarios();
  }
  
  getTotalPages(): number { return Math.max(1, this.totalPages); }

  private setPageData(data: PaginaResponse): void {
    const raw = (data?.elements ?? (Array.isArray(data) ? data : []));
    const elementos: Comentario[] = Array.isArray(raw) ? raw : [];

    // Detectar si es server paging o lista completa
    const hasServerPaging = typeof data?.totalPages === 'number' || typeof data?.totalElements === 'number';

    if (hasServerPaging) {
        this.listaComentarios = elementos;
        this.allComentarios = [];
        this.estaVacio = !!data.empty;
        this.totalElements = Number(data.totalElements || this.listaComentarios.length || 0);
        this.totalPages = Number(data.totalPages || Math.ceil(this.totalElements / this.pageSize) || 1);
        this.numberOfElements = Number((data as any).numberOfElements ?? this.listaComentarios.length);
        this.pagedComentarios = this.listaComentarios;

        // Boundary check
        if (elementos.length === 0 && this.pageNo > 0 && this.pageNo >= this.totalPages) {
            this.pageNo = Math.max(0, this.totalPages - 1);
            this.obtenerListaComentarios();
            return;
        }
    } else {
        // Fallback client paging
        this.allComentarios = elementos;
        this.totalElements = this.allComentarios.length;
        this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));
        this.estaVacio = this.totalElements === 0;
        
        if (this.pageNo >= this.totalPages) {
            this.pageNo = Math.max(0, this.totalPages - 1);
        }
        
        this.applyPaging();
    }
    this.cdr.detectChanges();
  }

  private applyPaging(): void {
    if (this.allComentarios.length > 0) {
        const start = this.pageNo * this.pageSize;
        const end = start + this.pageSize;
        this.pagedComentarios = this.allComentarios.slice(start, end);
        this.numberOfElements = this.pagedComentarios.length;
        this.listaComentarios = this.pagedComentarios;
    }
    this.cdr.detectChanges();
  }

  private hasActiveFilters(): boolean {
    return !!(this.basicSearchText || this.filtroUsuario || this.filtroAprobado !== null || this.filtroCuarentena !== null);
  }

  private buildSearchPayload(): any {
    const payload: any = {};
    if (this.basicSearchText) payload['term'] = this.basicSearchText;
    if (this.filtroUsuario) payload['username'] = this.filtroUsuario;
    if (this.filtroAprobado !== null) payload['aprobado'] = this.filtroAprobado;
    if (this.filtroCuarentena !== null) payload['cuarentena'] = this.filtroCuarentena;
    return payload;
  }

  private handlePageError(err: any): void {
    if (err?.status === 404) {
      this.log.warn('No se encontraron comentarios, asignando lista vacía.');
      this.listaComentarios = [];
      this.estaVacio = true;
      this.totalElements = 0;
      this.totalPages = 1;
      this.pagedComentarios = [];
    } else {
      this.log.error('Error al cargar comentarios', err);
    }
    this.cdr.detectChanges();
  }

  // Métodos antiguos de paginación por números eliminados en favor de Anterior/Siguiente

  public refrescarPagina(): void {
    window.location.reload();
  }

  openEdit(coment: Comentario): void {
    if (!coment?.idComentario) return;
    this.navigate('/admin/control/comentarios/editar/' + coment.idComentario);
  }

  deleteComentario(coment: Comentario): void {
    if (!coment?.idComentario) return;
    this.comentarioToDelete = coment;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.comentarioToDelete?.idComentario) {
        this.showDeleteModal = false;
        return;
    }
    
    this.cargando = true;
    this.comentarioService.borrar(this.comentarioToDelete.idComentario!)
        .pipe(takeUntil(this.destroy$), finalize(() => { this.cargando = false; this.cdr.detectChanges(); }))
        .subscribe({
            next: () => {
                this.showDeleteModal = false;
                this.comentarioToDelete = null;
                this.search();
            },
            error: (err) => {
                this.log.error('comentarios borrar', err);
                this.showDeleteModal = false;
                this.comentarioToDelete = null;
            }
        });
  }

  cancelDelete(): void {
      this.showDeleteModal = false;
      this.comentarioToDelete = null;
  }

  trackByComentario(index: number, c: Comentario): number {
    return c?.idComentario ?? index;
  }
}
