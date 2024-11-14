import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Comentario } from "src/app/core/models/comentario.model";
import { Entrada } from "src/app/core/models/entrada.model";
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
  currentPage = 1;
  totalPages = 5; // Ajusta este valor según tus necesidades
  pages: number[] = [];

  constructor(
    protected override router: Router,
    private comentarioService: ComentarioService,
    private usuarioService: UsuarioService,
    private entradaService: EntradaService,
    protected override datePipe: DatePipe
  ) {
    super(router, datePipe);
    this.initList();
    this.initPages();
  }

  private async initList() {
    try {
      const listaRes = await this.obtenerListaComentarios(this.currentPage);
      if (listaRes) {
        this.totalPages = listaRes.totalPages;
        for (const res of listaRes.data) {
          if (res) {
            res.fechaCreacionParseada = this.transformaFecha(res.fechaCreacion, 'dd/MM/yyyy', false);
            const usuario = await this.obtenerDatosUsuario(res.idUsuario);
            if (usuario) {
              res.username = usuario.username;
            }
            const entrada = await this.obtenerDatosEntrada(res.idEntrada);
            if (entrada) {
              res.tituloEntrada = entrada.titulo;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error initializing list:", error);
    }
  }

  override ngOnInit(): void {}

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

  private async obtenerListaComentarios(page: number): Promise<{ data: Comentario[], totalPages: number }> {
    return new Promise((resolve, reject) => {
      this.comentarioService.listarPagina(page,10).subscribe({
        next: data => {
          this.listaComentarios = data.data;
          resolve({ data: this.listaComentarios, totalPages: data.totalPages });
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

  private initPages() {
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.initList();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.initList();
  }

  onPreviousPage() {
    if (this.currentPage > 1) {
      this.onPageChange(this.currentPage - 1);
    }
  }

  onNextPage() {
    if (this.currentPage < this.totalPages) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  public checkTrueOrFalseToString(toCheck: boolean) {
    return toCheck ? 'Si' : 'No';
  }

  crearEntrada() {}

  actualizarEntrada(id: number) {}

  borrarEntrada(id: number) {}

  public refrescarPagina(): void {
    window.location.reload();
  }
}
