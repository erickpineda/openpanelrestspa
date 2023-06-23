import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Rol } from "../models/rol.model";

@Injectable({
  providedIn: "root"
})
export class RolService {
  private baseUrl = "http://localhost:8080/api/v1/roles";

  constructor(private http: HttpClient) { }

  list(): Observable<Rol[]> {
    const url = this.baseUrl;
    return this.http
      .get<Rol[]>(url);
      //.pipe(map((data: any) => data.map((item: Rol) => this.adapter.adapt(item))));
  }
}
