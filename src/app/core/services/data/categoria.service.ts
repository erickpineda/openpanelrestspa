import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Categoria } from "../../models/categoria.model";
import { CrudService } from "../../_utils/crud.service";
import { TokenStorageService } from "../auth/token-storage.service";

@Injectable({
  providedIn: "root"
})
export class CategoriaService extends CrudService<Categoria> {
  protected resource = '/categorias';

  constructor(
    protected override http: HttpClient,
    protected override token: TokenStorageService) {
    super(http, token);
  }

}
