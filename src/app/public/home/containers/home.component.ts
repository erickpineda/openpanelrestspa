import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { catchError, concatMap, Observable, of, Subscription } from 'rxjs';
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

    this.entradaService.listar()
      .pipe(
        catchError(error => {
          this.noHayEntradas = false;

          if (error.error instanceof ErrorEvent) {
            this.errorMsg = `Error: ${error.error.message}`;
          } else {
            this.errorMsg = "A client-side or network error occurred";
          }
          console.log("Desde HOME -> " + this.errorMsg);

          return of([]);

        }))
      .subscribe((data: Entrada[]) => {

        if (data.length < 1 || undefined) {
          this.noHayEntradas = false
        }
        this.entradas = data;
        this.entradas.forEach(_categorias => {
          this.categorias = _categorias.categorias;
        })
        console.log(this.entradas);
      }
      );
    
  }

  public refrescarPagina(): void {
    window.location.reload();
  }

}