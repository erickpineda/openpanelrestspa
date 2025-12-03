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
      this.obtenerListaComentarios().then((listaRes: PaginaResponse) => {
        this.listaComentarios = listaRes.elements;
        this.estaVacio = listaRes.empty;
        this.totalElements = this.listaComentarios?.length || 0;
        this.search();
      });
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

  private async obtenerListaComentarios(): Promise<PaginaResponse> {
    return new Promise((resolve, reject) => {
      this.comentarioService.listarSafe().subscribe({
        next: (lista: Comentario[]) => {
          const pResp: PaginaResponse = new PaginaResponse();
          pResp.elements = Array.isArray(lista) ? lista : [];
          resolve(pResp);
        },
        error: (err: any) => {
          if (err?.status === 404) {
            this.log.warn("No se encontraron comentarios, asignando lista vacía.");
            this.listaComentarios = [];
            resolve(new PaginaResponse()); // o ajusta según el modelo específico
          } else {
            reject(err);
          }
        }
      });
    });
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
  onPageSizeChange(size: number): void { this.pageSize = Number(size) || 10; this.pageNo = 0; this.updatePage(); }

  search(): void {
    const term = (this.basicSearchText || '').toLowerCase();
    const usuario = (this.filtroUsuario || '').toLowerCase();
    const aprob = this.filtroAprobado;
    const cuar = this.filtroCuarentena;
    const base = this.listaComentarios || [];
    this.filteredComentarios = base.filter(c => {
      const contenido = (c.contenido || '').toLowerCase();
      const user = (c.username || '').toLowerCase();
      const mBasic = !term || contenido.includes(term) || user.includes(term);
      const mUser = !usuario || user.includes(usuario);
      const mAprob = aprob === null || c.aprobado === aprob;
      const mCuar = cuar === null || c.cuarentena === cuar;
      return mBasic && mUser && mAprob && mCuar;
    });
    this.totalElements = this.filteredComentarios.length;
    this.pageNo = 0;
    this.updatePage();
  }

  reset(): void {
    this.basicSearchText = '';
    this.filtroUsuario = '';
    this.filtroAprobado = null;
    this.filtroCuarentena = null;
    this.pageNo = 0;
    this.search();
  }

  prev(): void { if (this.pageNo > 0) { this.pageNo--; this.updatePage(); } }
  next(): void { if (this.pageNo < this.getTotalPages() - 1) { this.pageNo++; this.updatePage(); } }
  getTotalPages(): number { return Math.max(1, Math.ceil(this.totalElements / this.pageSize)); }

  private updatePage(): void {
    const start = this.pageNo * this.pageSize;
    const end = start + this.pageSize;
    this.pagedComentarios = this.filteredComentarios.slice(start, end);
  }

  // Métodos antiguos de paginación por números eliminados en favor de Anterior/Siguiente

  public refrescarPagina(): void {
    window.location.reload();
  }
}
