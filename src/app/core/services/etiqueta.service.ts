import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Etiqueta } from "../models/etiqueta.model";
import { CrudService } from "../_utils/crud.service";
import { TokenStorageService } from "./token-storage.service";

@Injectable({
  providedIn: "root"
})
export class EtiquetaService extends CrudService<Etiqueta> {
  protected resource = '/etiquetas';

  constructor(
    protected override http: HttpClient,
    protected override token: TokenStorageService) {
    super(http, token);
  }
}
