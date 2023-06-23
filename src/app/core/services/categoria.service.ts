import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Categoria } from "../models/categoria.model";

@Injectable({
  providedIn: "root"
})
export class CategoriaService {
  private baseUrl = "http://localhost:8080/api/v1/categorias";

  constructor(private http: HttpClient) { }

  /*========================================
   CRUD Methods for consuming RESTful API
 =========================================*/
  // Http Options
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  listar(): Observable<Categoria[]> {
    const url = this.baseUrl;
    return this.http
      .get<Categoria[]>(url, this.httpOptions);
      //.pipe(map((data: any) => data.map((item: Categoria) => this.adapter.adapt(item))));
  }
}
