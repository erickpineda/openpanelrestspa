import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Comentario } from "../models/comentario.model";

@Injectable({
  providedIn: "root"
})
export class RolService {
  private baseUrl = "http://localhost:8080/api/v1/comentarios";

  constructor(private http: HttpClient) { }

  list(): Observable<Comentario[]> {
    const url = this.baseUrl;
    return this.http
      .get<Comentario[]>(url);
      //.pipe(map((data: any) => data.map((item: Comentario) => this.adapter.adapt(item))));
  }
}
