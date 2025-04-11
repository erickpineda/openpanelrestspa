import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Entrada } from '../../../core/models/entrada.model';
import { Usuario } from '../../../core/models/usuario.model';
import { EntradaService } from '../../../core/services/entrada.service';
import { LoadingService } from '../../../core/services/loading.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { OpenpanelApiResponse } from '../../../core/models/openpanel-api-response.model';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss']
})
export class ListadoEntradasComponent implements OnInit {
  entrada: Entrada = new Entrada();
  listaEntradas: Entrada[] = [];
  nombresCategoriasConComas: string = '';

  totalPages: number = 0;
  totalElements: number = 0;
  size: number = 1; // Tamaño de elementos por página
  currentPage: number = 0;
  hasMore: boolean = false;
  cacheEntradas: Map<number, Entrada[]> = new Map();
  paginasVisibles: number[] = [];
  paginasRange: number = 4; // Definir el alcance de páginas visibles

  constructor(
    private commonFuncService: CommonFunctionalityService,
    private entradaService: EntradaService,
    private usuarioService: UsuarioService,
    public loader: LoadingService
  ) {}

  ngOnInit(): void {
    this.obtenerListaEntradas(this.currentPage);
  }

  public obtenerListaEntradas(page: number): Promise<Entrada[]> {
    this.currentPage = page; // Asegúrate de actualizar currentPage antes de calcular visibles
    return new Promise((resolve, reject) => {
      this.entradaService.listarPagina(page, this.size).subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const entradas: Entrada[] = Array.isArray(response.data.elements) ? response.data.elements : [];
          if (entradas) {
            this.listaEntradas = entradas;
            this.cacheEntradas.set(page, entradas);
            this.totalPages = response.data.totalPages;
            this.totalElements = response.data.totalElements;
            this.hasMore = page < this.totalPages - 1;
            this.actualizarPaginasVisibles(); // Asegurar que se recalcula después de actualizaciones
            entradas.forEach(entradaRes => {
              entradaRes.categoriasConComas = entradaRes.categorias.map(e => e.nombre).join(', ');
              this.obtenerDatosUsuario(entradaRes.idUsuario).then(usu => {
                if (usu) {
                  entradaRes.username = usu.username;
                }
              });
            });
            this.scrollToTop();
            resolve(this.listaEntradas);
          } else {
            resolve([]);
          }
        },
        error: err => {
          if (err && err.status == 404 && err.error && err.error.message) {
            this.listaEntradas = [];
            this.scrollToTop();
            resolve(this.listaEntradas);
          }
          reject(err);
        }
      });
    });
  }

  cambiarPagina(incremento: number): void {
    const nuevaPagina = this.currentPage + incremento;
    if (nuevaPagina >= 0 && nuevaPagina < this.totalPages) {
      this.obtenerListaEntradas(nuevaPagina);
    }
  }

  private obtenerDatosUsuario(idUsuario: number): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      this.usuarioService.obtenerPorId(idUsuario).subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const usuario: Usuario = (response.data) ? response.data : Usuario;
          resolve(usuario);
        },
        error: err => {
          reject(err);
        }
      });
    });
  }

  public checkFechaPublicacion(fechaPublicacion: Date): string {
    return fechaPublicacion ? this.commonFuncService.transformaFecha(fechaPublicacion, 'dd/MM/yyyy', false) : 'No publicada';
  }

  crearEntrada() {}

  actualizarEntrada(id: number) {}

  borrarEntrada(id: number) {}

  public refrescarPagina(): void {
    window.location.reload();
  }

  private actualizarHasMore(): void {
    this.hasMore = this.currentPage < this.totalPages - 1;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private actualizarPaginasVisibles(): void {
    const middle = Math.floor(this.paginasRange / 2);
    const start = Math.max(0, Math.min(this.currentPage - middle, this.totalPages - this.paginasRange));
    const end = Math.min(this.totalPages, start + this.paginasRange);
    this.paginasVisibles = Array.from({ length: end - start }, (_, i) => start + i);
  }
}
