import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Usuario } from "../models/usuario.model";
import { CrudService } from "../_utils/crud.service";
import { TokenStorageService } from "./token-storage.service";

@Injectable({
  providedIn: "root"
})
export class UsuarioService extends CrudService<Usuario> {
  protected resource = '/usuarios';

  constructor(
    protected override http: HttpClient,
    protected override token: TokenStorageService) {
    super(http, token);
  }

}
