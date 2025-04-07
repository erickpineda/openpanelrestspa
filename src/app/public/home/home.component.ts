import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { delay } from 'rxjs';
import { Categoria } from '../../core/models/categoria.model';
import { Entrada } from '../../core/models/entrada.model';
import { EntradaService } from '../../core/services/entrada.service';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  loading$ = this.loader.loading$;

  loading: boolean = false;
  cargaFinalizada: boolean = false;

  characters: any;
  continents: any;
  noHayEntradas: boolean;
  errorMsg: string;

  entradas: Entrada[];
  categorias: Categoria[];

  page = 1;
  pageSize = 5;
  pagedEntradas: any[] = [];

  constructor(private entradaService: EntradaService, public loader: LoadingService, private http: HttpClient) {
    this.entradas = [];
    this.categorias = [];
    this.noHayEntradas = true;
    this.errorMsg = "";
  }

  ngOnInit(): void {
    this.listenToLoading();
    this.obtenerListaEntradas().then((listaRes: Entrada[]) => {
      listaRes.forEach((entradaRes) => {
        entradaRes.categoriasConComas = entradaRes.categorias.map(e => e.nombre).join(', ');
      });
      this.refreshEntradas(); // Refrescar las entradas después de obtener la lista
    });
  }

  obtenerListaEntradas(): Promise<Entrada[]> {
    return new Promise((resolve, reject) => {
      this.entradaService.listar().subscribe({
        next: data => {
          if (data) {
            if (data.data.length < 1 || undefined) {
              this.noHayEntradas = false
            }
            this.entradas = data.data;
            this.entradas.forEach(_categorias => {
              this.categorias = _categorias.categorias;
            })
          }
          resolve(this.entradas);
        },
        error: err => {
          this.noHayEntradas = false;
          if (err.error instanceof ErrorEvent) {
            this.errorMsg = `Error: ${err.error.message}`;
          } else {
            this.errorMsg = "A client-side or network error occurred";
          }
          console.log("Desde HOME -> " + this.errorMsg);
          reject(err);
        }
      });
    });
  }

  listenToLoading(): void {
    this.loader.loadingSub
      .pipe(delay(0)) // This prevents a ExpressionChangedAfterItHasBeenCheckedError for subsequent requests
      .subscribe((loading) => {
        this.loading = loading;
        if (loading === false) {
          this.cargaFinalizada = true;
        }
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