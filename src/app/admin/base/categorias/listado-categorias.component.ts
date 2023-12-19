import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Categoria } from "src/app/core/models/categoria.model";
import { Usuario } from "src/app/core/models/usuario.model";
import { CategoriaService } from "src/app/core/services/categoria.service";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { UsuarioService } from "src/app/core/services/usuario.service";
import { CommonFunctionalityComponent } from "src/app/shared/components/funcionalidades-comunes/common-functionality.component";

@Component({
  selector: 'app-listado-categorias',
  templateUrl: './listado-categorias.component.html',
  styleUrls: ['./listado-categorias.component.scss']
})

export class ListadoCategoriasComponent extends CommonFunctionalityComponent implements OnInit {

  listaCategorias: Categoria[] = [];
  usuarioEnSesion: Usuario = new Usuario();

  constructor(
    protected override router: Router,
    private categoriaService: CategoriaService,
    private usuarioService: UsuarioService,
    private tokenStorageService: TokenStorageService,
    protected override datePipe: DatePipe
    ) {
      super(router, datePipe);

      this.initList();
  }

  private initList() {
    this.obtenerListaCategorias().then((listaRes: Categoria[]) => {
      if (listaRes) {
        this.listaCategorias = listaRes;
        this.obtenerDatosUsuarioActual().then((usu: Usuario)=>{
          if (usu) {
            this.usuarioEnSesion = usu;
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

  private obtenerDatosUsuarioActual(): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      const currentUser = this.tokenStorageService.getUser();
      this.usuarioService.obtenerPorId(currentUser.id).subscribe({
        next: (data: Usuario | PromiseLike<Usuario>) => {
          resolve(data);
        },
        error: (err: any) => {
          reject(err);
        }
      });
    })
  }

  private obtenerListaCategorias(): Promise<Categoria[]> {
    return new Promise((resolve, reject) => {
      this.categoriaService.listar().subscribe({
        next: (data: Categoria[]) => {
          resolve(data);
        },
        error: (err: { status: number; error: { message: any; }; }) => {
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

