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

@Component({
  selector: 'app-listado-comentarios',
  templateUrl: './listado-comentarios.component.html',
  styleUrls: ['./listado-comentarios.component.scss']
})

export class ListadoComentariosComponent implements OnInit {

  listaComentarios: Comentario[] = [];

  page = 1;
  pageSize = 5;
  pageCurrent = 0;
  pagedComentarios: any[] = [];

  estaVacio: boolean = false;

  constructor(
    private router: Router,
    private comentarioService: ComentarioService,
    private usuarioService: UsuarioService,
    private entradaService: EntradaService,
    private commonFuncService: CommonFunctionalityService,
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
        if (!this.estaVacio) {
          this.refreshComentarios();
        }
      });
    } catch (error) {
      console.error("Error initializing list:", error);
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
      this.comentarioService.listarPagina(this.pageCurrent, this.pageSize).subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const pResp: PaginaResponse = (response.data) ? response.data : PaginaResponse;
          pResp.elements = response.data?.elements;
          resolve(pResp);
        },
        error: (err: any) => {
          if (err?.status === 404) {
            console.warn("No se encontraron comentarios, asignando lista vacía.");
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

  refreshComentarios() {
    this.pagedComentarios= this.listaComentarios.slice(
      (this.page - 1) * this.pageSize,
      (this.page - 1) * this.pageSize + this.pageSize
    );
  }

  onPageChange(page: number) {
    //if (page < 1 || page > this.numberOfPages) return;
    
    if (page < 1) return;

    if (page > this.numberOfPages) {
      this.pageCurrent = page;
      this.obtenerListaComentarios().then((listaRes: PaginaResponse) => {
        this.listaComentarios = listaRes.elements;
        this.estaVacio = listaRes.empty;
        if (this.estaVacio) {
          this.page = this.pageCurrent;
          return;
        } else {
          this.refreshComentarios();
        }
      });
    }

    this.page = page;
  }

  get numberOfPages(): number {
    return this.listaComentarios.length === 0? 1: Math.ceil(this.listaComentarios.length / this.pageSize);
  }

  getPages(): number[] {
    return Array.from({ length: this.numberOfPages }, (v, k) => k + 1);
  }

  public refrescarPagina(): void {
    window.location.reload();
  }
}