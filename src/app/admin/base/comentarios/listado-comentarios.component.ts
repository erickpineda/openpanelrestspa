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
    this.obtenerListaComentarios().then((listaRes: Comentario[]) => {
      if (listaRes) {
        listaRes.forEach((res) => {
          if (res) {
            res.fechaCreacionParseada = this.transformaFecha(res.fechaCreacion, 'dd/MM/yyyy', false);
            
            this.obtenerDatosUsuario(res.idUsuario).then((usu: Usuario) => {
              if (usu) {
                res.username = usu.username;
              }
            });
            this.obtenerDatosEntrada(res.idEntrada).then((ent: Entrada) => {
              if (ent) {
                res.tituloEntrada = ent.titulo;
              }
            });
          }
        });
      }
    });
  }

  private obtenerDatosUsuario(idUsuario: number): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      this.usuarioService.obtenerPorId(idUsuario).subscribe({
        next: data => {
          resolve(data);
        },
        error: err => {
          reject(err);
        }
      });
    });
  }

  private obtenerDatosEntrada(idEntrada: number): Promise<Entrada> {
    return new Promise((resolve, reject) => {
      this.entradaService.obtenerPorId(idEntrada).subscribe({
        next: data => {
          resolve(data);
        },
        error: err => {
          reject(err);
        }
      });
    });
  }

  private obtenerListaComentarios(): Promise<Comentario[]> {
    return new Promise((resolve, reject) => {
      this.comentarioService.listar().subscribe({
        next: data => {
          this.listaComentarios = data;
          resolve(this.listaComentarios);
        },
        error: err => {
          reject(err);
        }
      });
    });
  }

  public checkTrueOrFalseToString(toCheck: boolean) {
    return toCheck? 'Si': 'No';
  }

  crearEntrada() {

  }

  actualizarEntrada(id: number) {

  }

  borrarEntrada(id: number) {

  }

  public refrescarPagina(): void {
    window.location.reload();
  }

}

function moment(StackMoment: string) {
  throw new Error("Function not implemented.");
}
