import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { catchError, Observable, of, Subscription, throwError } from 'rxjs';
import { map, retry } from "rxjs/operators";
import { Entrada } from "../models/entrada.model";
import { TipoEntrada } from "../models/tipo-entrada.model";
import { EstadoEntrada } from "../models/estado-entrada.model";

@Injectable({
  providedIn: "root"
})
export class EntradaService {
  private baseUrl = "http://localhost:8080/api/v1/entradas";
  private errorMsg: string;

  constructor(private http: HttpClient) {
    this.errorMsg = "";
  }

  /*========================================
   CRUD Methods for consuming RESTful API
 =========================================*/
  // Http Options
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  listar(): Observable<Entrada[]> {
    const url = this.baseUrl;
    return this.http.get<Entrada[]>(url, this.httpOptions);

    /*return this.http
      .get(url, this.httpOptions)
      .pipe(map((data: any) => data.map((item: Entrada) => this.adapter.adapt(item))));*/
  }

  listarTiposEntradas(): Observable<TipoEntrada[]> {
    const url = `${this.baseUrl}/tipos`;
    return this.http.get<TipoEntrada[]>(url, this.httpOptions);
    /*return this.http
      .get(url, this.httpOptions)
      .pipe(map((data: any) => data.map((item: Entrada) => this.adapter.adapt(item))));*/
  }

  listarEstadosEntradas(): Observable<EstadoEntrada[]> {
    const url = `${this.baseUrl}/estados`;
    return this.http.get<EstadoEntrada[]>(url, this.httpOptions);
    /*return this.http
      .get(url, this.httpOptions)
      .pipe(map((data: any) => data.map((item: Entrada) => this.adapter.adapt(item))));*/
  }

  obtenerPorId(id: number): Observable<Entrada> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<Entrada>(url);
    /*return this.http
      .get(url, this.httpOptions)
      .pipe(map((data: any) => data.map((item: Entrada) => this.adapter.adapt(item))));*/
  }

  crear(entrada: Entrada): Observable<Entrada> {
    const url = `${this.baseUrl}/crear`;
    return this.http.post<Entrada>(url, entrada, this.httpOptions);
    /*return this.http
      .post(url, entrada, this.httpOptions)
      .pipe(map((data: any) => data.map((item: Entrada) => this.adapter.adapt(item))));*/
  }

  actualizar(id: number, entrada: Entrada): Observable<Entrada> {
    const url = `${this.baseUrl}/${id}`;
    return this.http
      .put<Entrada>(url, entrada, this.httpOptions)
    /*return this.http
      .put(url, entrada, this.httpOptions)
      .pipe(map((data: any) => data.map((item: Entrada) => this.adapter.adapt(item))));*/
  }

  borrar(id: number): Observable<string> {
    const url = `${this.baseUrl}/${id}`;
    return this.http
      .delete<string>(url, this.httpOptions);
    /*return this.http
      .delete(url, this.httpOptions)
      .pipe(map((data: any) => data.map((item: Entrada) => this.adapter.adapt(item))));*/
  }

}
