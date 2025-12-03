import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
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
  styleUrls: ['./listado-comentarios.component.scss']
})

export class ListadoComentariosComponent implements OnInit {

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

  estaVacio: boolean = false;

  constructor(
    private router: Router,
    private comentarioService: ComentarioService,
    private usuarioService: UsuarioService,
    private entradaService: EntradaService,
    private commonFuncService: CommonFunctionalityService,
    private log: LoggerService
  ) {
    
  }

  ngOnInit(): void {
    this.initList();
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
    const hasFilters = this.hasActiveFilters();
    if (!hasFilters) {
      this.comentarioService.listarPagina(this.pageNo, this.pageSize).subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const data: PaginaResponse = response?.data || new PaginaResponse();
          this.setPageData(data);
        },
        error: (err: any) => this.handlePageError(err)
      });
    } else {
      const payload: any = this.buildSearchPayload();
      this.comentarioService.buscarSafe(payload, this.pageNo, this.pageSize).subscribe({
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
  onPageSizeChange(size: number): void { this.pageSize = Number(size) || 10; this.pageNo = 0; this.obtenerListaComentarios(); }

  search(): void { this.pageNo = 0; this.obtenerListaComentarios(); }

  reset(): void {
    this.basicSearchText = '';
    this.filtroUsuario = '';
    this.filtroAprobado = null;
    this.filtroCuarentena = null;
    this.pageNo = 0;
    this.obtenerListaComentarios();
  }

  prev(): void { if (this.pageNo > 0) { this.pageNo--; this.obtenerListaComentarios(); } }
  next(): void { if (this.pageNo < this.totalPages - 1) { this.pageNo++; this.obtenerListaComentarios(); } }
  getTotalPages(): number { return Math.max(1, this.totalPages); }

  private setPageData(data: PaginaResponse): void {
    this.listaComentarios = Array.isArray(data.elements) ? data.elements : [];
    this.estaVacio = !!data.empty;
    this.totalElements = Number(data.totalElements || this.listaComentarios.length || 0);
    this.totalPages = Number(data.totalPages || 1);
    this.numberOfElements = Number((data as any).numberOfElements ?? this.listaComentarios.length);
    this.pagedComentarios = this.listaComentarios;
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
    if (!confirm('¿Eliminar comentario #' + coment.idComentario + '?')) return;
    this.comentarioService.borrar(coment.idComentario!).subscribe({
      next: () => { this.search(); },
      error: (err) => { this.log.error('comentarios borrar', err); }
    });
  }
}
