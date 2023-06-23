import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Etiqueta } from "../models/etiqueta.model";

@Injectable({
  providedIn: "root"
})
export class RolService {
  private baseUrl = "http://localhost:8080/api/v1/etiquetas";

  constructor(private http: HttpClient) { }

  list(): Observable<Etiqueta[]> {
    const url = this.baseUrl;
    return this.http
      .get<Etiqueta[]>(url);
      //.pipe(map((data: any) => data.map((item: Etiqueta) => this.adapter.adapt(item))));
  }
}
