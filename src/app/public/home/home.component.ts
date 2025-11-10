import { Component, OnInit } from '@angular/core';
import { Entrada } from '../../core/models/entrada.model';
import { Categoria } from '../../core/models/categoria.model';
import { EntradaService } from '../../core/services/data/entrada.service';
import { LoadingService } from '../../core/services/ui/loading.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  cargaFinalizada: boolean = false;
  noHayEntradas: boolean = true;
  errorMsg: string = '';
  entradas: Entrada[] = [];
  categorias: Categoria[] = [];

  page = 1;
  pageSize = 5;
  pagedEntradas: any[] = [];

  constructor(
    private entradaService: EntradaService,
    public loader: LoadingService
  ) {}

  ngOnInit(): void {
    this.obtenerListaEntradas()
      .then((listaRes: Entrada[]) => {
        listaRes.forEach((entradaRes) => {
          entradaRes.categoriasConComas = entradaRes.categorias.map(e => e.nombre).join(', ');
        });
        this.refreshEntradas(); // Refrescar las entradas después de obtener la lista
      })
      .catch((error) => {
        console.error('Error al obtener lista de entradas:', error.message);
        this.errorMsg = 'No se pudieron cargar las entradas, intenta nuevamente más tarde.';
        console.log(this.errorMsg);
      });
  }

  obtenerListaEntradas(): Promise<Entrada[]> {
    return new Promise((resolve, reject) => {
      this.entradaService.listar()
        .subscribe({
          next: (response) => {
            const entradas: Entrada[] = Array.isArray(response.data?.elements) ? response.data.elements : [];
            if (entradas.length < 1) {
              this.noHayEntradas = false;
            } else {
              this.entradas = entradas;
              this.categorias = this.entradas.flatMap(e => e.categorias);
            }
            resolve(this.entradas);
          },
          error: (error) => {
            this.noHayEntradas = false;
            reject(error);
          }
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
}
