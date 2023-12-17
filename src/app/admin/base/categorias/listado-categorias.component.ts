import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Categoria } from "src/app/core/models/categoria.model";
import { Comentario } from "src/app/core/models/comentario.model";
import { Entrada } from "src/app/core/models/entrada.model";
import { Usuario } from "src/app/core/models/usuario.model";
import { CategoriaService } from "src/app/core/services/categoria.service";
import { ComentarioService } from "src/app/core/services/comentario.service";
import { EntradaService } from "src/app/core/services/entrada.service";
import { UsuarioService } from "src/app/core/services/usuario.service";
import { CommonFunctionalityComponent } from "src/app/shared/components/funcionalidades-comunes/common-functionality.component";

@Component({
  selector: 'app-listado-categorias',
  templateUrl: './listado-categorias.component.html',
  styleUrls: ['./listado-categorias.component.scss']
})

export class ListadoCategoriasComponent extends CommonFunctionalityComponent implements OnInit {

  listaCategorias: Categoria[] = [];

  constructor(
    protected override router: Router,
    private categoriaService: CategoriaService,
    private usuarioService: UsuarioService,
    protected override datePipe: DatePipe
    ) {
      super(router, datePipe);

      this.initList();
  }

  private initList() {
    this.obtenerListaCategorias().then((listaRes: Categoria[]) => {
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

  override ngOnInit(): void {
    
  }

  navigate(urlToNavigate: string){
    this.router.navigate([urlToNavigate])
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

  private obtenerListaCategorias(): Promise<Categoria[]> {
    return new Promise((resolve, reject) => {
      this.categoriaService.listar().subscribe({
        next: data => {
          this.listaCategorias = data;
          resolve(this.listaCategorias);
        },
        error: err => {
          if (err) {
            if (err.status == 404) {
              if (err.error && err.error.message) {
                this.listaCategorias = [];
              }
            }
          }
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

