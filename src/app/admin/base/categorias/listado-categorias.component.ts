import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Categoria } from "../../../core/models/categoria.model";
import { CategoriaService } from "../../../core/services/data/categoria.service";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
  selector: 'app-listado-categorias',
  templateUrl: './listado-categorias.component.html',
  styleUrls: ['./listado-categorias.component.scss']
})
export class ListadoCategoriasComponent implements OnInit {
  listaCategorias: Categoria[] = [];
  cargando = false;
  errorMsg: string | null = null;

  constructor(
    private router: Router,
    private categoriaService: CategoriaService,
    private log: LoggerService
  ) {}

  ngOnInit(): void {
    this.obtenerListaCategorias();
  }

  obtenerListaCategorias(): void {
    this.cargando = true;
    this.errorMsg = null;
    this.categoriaService.listar().subscribe({
      next: (response: any) => {
        const categorias: Categoria[] = Array.isArray(response.data?.elements) ? response.data.elements : [];
        this.listaCategorias = categorias;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        if (err?.status === 404) {
          this.listaCategorias = [];
          this.errorMsg = 'No se encontraron categorías.';
        } else {
          this.errorMsg = 'Error al cargar categorías.';
          this.log.error('Error al cargar categorías:', err);
        }
      }
    });
  }

  refrescar(): void {
    this.obtenerListaCategorias();
  }

  crearCategoria(): void {
    this.router.navigate(['/admin/control/categorias/crear']);
  }

  editarCategoria(id: number): void {
    this.router.navigate(['/admin/control/categorias/editar', id]);
  }

  borrarCategoria(id: number): void {
    // Aquí podrías abrir un modal de confirmación y luego llamar al servicio para borrar
    // this.categoriaService.borrar(id).subscribe(...)
    alert('Funcionalidad de borrado no implementada');
  }

  trackByCategoriaId(index: number, categoria: Categoria): number {
    return categoria.idCategoria;
  }
}