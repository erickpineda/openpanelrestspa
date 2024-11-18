import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Comentario } from "src/app/core/models/comentario.model";
import { Entrada } from "src/app/core/models/entrada.model";
import { PaginaResponse } from "src/app/core/models/pagina-response.model";
import { Usuario } from "src/app/core/models/usuario.model";
import { ComentarioService } from "src/app/core/services/comentario.service";
import { EntradaService } from "src/app/core/services/entrada.service";
import { UsuarioService } from "src/app/core/services/usuario.service";
import { CommonFunctionalityComponent } from "src/app/shared/components/funcionalidades-comunes/common-functionality.component";

@Component({
  selector: 'app-listado-comentarios',
  templateUrl: './listado-comentarios.component.html',
  styleUrls: ['./listado-comentarios.component.scss']
})

export class ListadoComentariosComponent extends CommonFunctionalityComponent implements OnInit {

  listaComentarios: Comentario[] = [];

  page = 1;
  pageSize = 5;
  pageCurrent = 0;
  pagedComentarios: any[] = [];

  estaVacio: boolean = false;

  constructor(
    protected override router: Router,
    private comentarioService: ComentarioService,
    private usuarioService: UsuarioService,
    private entradaService: EntradaService,
    protected override datePipe: DatePipe
  ) {
    super(router, datePipe);
    
  }

  override ngOnInit(): void {
    this.initList();
  }

  private initList() {
    try {
      this.obtenerListaComentarios().then((listaRes: PaginaResponse) => {
        this.listaComentarios = listaRes.data;
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
        next: data => {
          resolve(data);
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
        next: data => {
          resolve(data);
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
        next: data => {
          resolve(data);
        },
        error: (err: any) => {
          if (err && err.status == 404 && err.error && err.error.message) {
            this.listaComentarios = [];
          }
          reject(err);
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
        this.listaComentarios = listaRes.data;
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