import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Categoria } from "../../../core/models/categoria.model";
import { CategoriaService } from "../../../core/services/categoria.service";
import { TokenStorageService } from "../../../core/services/token-storage.service";
import { UsuarioService } from "../../../core/services/usuario.service";
import { CommonFunctionalityComponent } from "../../../shared/components/funcionalidades-comunes/common-functionality.component";

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
    private tokenStorageService: TokenStorageService,
    protected override datePipe: DatePipe
  ) {
    super(router, datePipe);
  }

  override ngOnInit(): void {
    this.initList();
  }

  private async initList() {
    try {
      const listaRes = await this.obtenerListaCategorias();
      if (listaRes) {
        this.listaCategorias = listaRes;
      }
    } catch (error) {
      console.error('Error initializing list:', error);
    }
  }

  navigate(urlToNavigate: string) {
    this.router.navigate([urlToNavigate])
  }

  private obtenerListaCategorias(): Promise<Categoria[]> {
    return new Promise((resolve, reject) => {
      this.categoriaService.listar().subscribe({
        next: data => resolve(data.data),
        error: err => {
          if (err?.status == 404) {
            this.listaCategorias = [];
          }
          reject(err);
        }
      });
    });
  }

  public refrescarPagina(): void {
    window.location.reload();
  }

  crearCategoria() {}
  actualizarCategoria(id: number) {}
  borrarCategoria(id: number) {}

}