import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Categoria } from 'src/app/core/models/categoria.model';
import { Entrada } from 'src/app/core/models/entrada.model';
import { EntradaService } from 'src/app/core/services/entrada.service';
import { LoadingService } from 'src/app/core/services/loading.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  loading$ = this.loader.loading$;

  characters: any;
  continents: any;
  noHayEntradas: boolean;
  errorMsg: string;

  entradas: Entrada[];
  categorias: Categoria[];

  constructor(private entradaService: EntradaService, public loader: LoadingService, private http: HttpClient) {
    this.entradas = [];
    this.categorias = [];
    this.noHayEntradas = true;
    this.errorMsg = "";
  }

  ngOnInit(): void {
      this.obtenerListaEntradas().then((listaRes: Entrada[]) => {
        listaRes.forEach((entradaRes) => {
          entradaRes.categoriasConComas = entradaRes.categorias.map(e => e.nombre).join(', ');
        });
      });
      
  }

  obtenerListaEntradas(): Promise<Entrada[]> {
    return new Promise((resolve, reject) => {
      this.entradaService.listar().subscribe({
        next: data => {
          if (data) {
            if (data.length < 1 || undefined) {
              this.noHayEntradas = false
            }
            this.entradas = data;
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

  public refrescarPagina(): void {
    window.location.reload();
  }

}