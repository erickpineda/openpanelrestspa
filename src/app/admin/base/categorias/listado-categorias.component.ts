import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Categoria } from "../../../core/models/categoria.model";
import { CategoriaService } from "../../../core/services/data/categoria.service";
import { TokenStorageService } from "../../../core/services/auth/token-storage.service";
import { UsuarioService } from "../../../core/services/data/usuario.service";
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { OpenpanelApiResponse } from "../../../core/models/openpanel-api-response.model";

@Component({
  selector: 'app-listado-categorias',
  templateUrl: './listado-categorias.component.html',
  styleUrls: ['./listado-categorias.component.scss']
})
export class ListadoCategoriasComponent implements OnInit {

  listaCategorias: Categoria[] = [];

  constructor(
    private router: Router,
    private categoriaService: CategoriaService,
    private usuarioService: UsuarioService,
    private tokenStorageService: TokenStorageService,
    private commonFuncService: CommonFunctionalityService,
  ) {
  }

  ngOnInit(): void {
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
        next: (response: OpenpanelApiResponse<any>) => {
          const categorias: Categoria[] = Array.isArray(response.data?.elements) ? response.data.elements : [];
          resolve(categorias);
        },
        error: (err) => {
          if (err?.status === 404) {
            this.listaCategorias = [];
            console.warn('No se encontraron categorías. Estableciendo lista vacía.');
            resolve([]);
          } else {
            reject(err);
          }
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