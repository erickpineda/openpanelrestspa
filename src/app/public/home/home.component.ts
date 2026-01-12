import { Component, OnInit } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { Entrada } from '../../core/models/entrada.model';
import { Categoria } from '../../core/models/categoria.model';
import { EntradaService } from '../../core/services/data/entrada.service';
import { LoadingService } from '../../core/services/ui/loading.service';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false,
})
export class HomeComponent implements OnInit {
  cargaFinalizada: boolean = false;
  hasEntries: boolean = false;
  errorMsg: string = '';
  entradas: Entrada[] = [];
  categorias: Categoria[] = [];

  page = 1;
  pageSize = 5;
  pagedEntradas: any[] = [];

  constructor(
    private entradaService: EntradaService,
    private log: LoggerService,
    private translate: TranslationService
  ) { }

  ngOnInit(): void {
    this.obtenerListaEntradas()
      .then((listaRes: Entrada[]) => {
        listaRes.forEach((entradaRes) => {
          entradaRes.categoriasConComas = entradaRes.categorias.map((e) => e.nombre).join(', ');
        });
        this.refreshEntradas(); // Refrescar las entradas después de obtener la lista
      })
      .catch((error) => {
        this.log.error('Error al obtener lista de entradas:', error.message);
        this.errorMsg = 'PUBLIC.HOME.LOAD_ERROR';
        this.log.error(this.errorMsg);
        this.cargaFinalizada = true; // Ensure UI renders even on error
      });
  }

  obtenerListaEntradas(): Promise<Entrada[]> {
    return new Promise((resolve, reject) => {
      this.entradaService.listarPagina().subscribe({
        next: (response) => {
          const entradas: Entrada[] = Array.isArray(response.data?.elements)
            ? response.data.elements
            : [];

          if (entradas.length > 0) {
            this.hasEntries = true;
            this.entradas = entradas;
            this.categorias = this.entradas.flatMap((e) => e.categorias);
          } else {
            this.hasEntries = false;
          }
          this.cargaFinalizada = true;
          resolve(entradas);
        },
        error: (error) => {
          this.hasEntries = false;
          this.cargaFinalizada = true;
          reject(error);
        },
      });
    });
  }

  refreshEntradas() {
    this.pagedEntradas = this.entradas.slice(
      (this.page - 1) * this.pageSize,
      (this.page - 1) * this.pageSize + this.pageSize
    );
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.numberOfPages) return;
    this.page = page;
    this.refreshEntradas();
  }

  get numberOfPages(): number {
    return Math.ceil(this.entradas.length / this.pageSize);
  }

  getPages(): number[] {
    return Array.from({ length: this.numberOfPages }, (v, k) => k + 1);
  }

  public refrescarPagina(): void {
    window.location.reload();
  }

  trackByCategoria(index: number, c: Categoria): number | string {
    return c?.idCategoria ?? c?.nombre ?? index;
  }

  trackByEntrada(index: number, e: Entrada): number {
    return e?.idEntrada ?? index;
  }
}
