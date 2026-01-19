import { Component, OnInit } from '@angular/core';
import { TranslationService } from '@app/core/services/translation.service';
import { Entrada } from '@app/core/models/entrada.model';
import { Categoria } from '@app/core/models/categoria.model';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { LoggerService } from '@app/core/services/logger.service';

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
        listaRes.forEach((entradaRes: any) => {
          entradaRes.categoriasConComas = entradaRes.categorias.map((e: any) => e.nombre).join(', ');
        });
        this.refreshEntradas();
      })
      .catch((error) => {
        this.log.error('Error al obtener lista de entradas:', error.message);
        this.errorMsg = 'PUBLIC.HOME.LOAD_ERROR';
        this.log.error(this.errorMsg);
        this.cargaFinalizada = true;
      });
  }
  obtenerListaEntradas(): Promise<Entrada[]> {
    return new Promise((resolve, reject) => {
      this.entradaService.listarPagina().subscribe({
        next: (response: any) => {
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
        error: (error: any) => {
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
