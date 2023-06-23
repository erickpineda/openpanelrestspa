import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Usuario } from "../models/usuario.model";

@Injectable({
  providedIn: "root"
})
export class RolService {
  private baseUrl = "http://localhost:8080/api/v1/usuarios";

  constructor(private http: HttpClient) { }

  list(): Observable<Usuario[]> {
    const url = this.baseUrl;
    return this.http
      .get<Usuario[]>(url);
      //.pipe(map((data: any) => data.map((item: Usuario) => this.adapter.adapt(item))));
  }
}
