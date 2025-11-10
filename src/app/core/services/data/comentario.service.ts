import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Comentario } from "../../models/comentario.model";
import { CrudService } from "../../_utils/crud.service";
import { TokenStorageService } from "../auth/token-storage.service";

@Injectable({
  providedIn: "root"
})
export class ComentarioService extends CrudService<Comentario> {
  protected resource = '/comentarios';

  constructor(
    protected override http: HttpClient,
    protected override token: TokenStorageService) {
    super(http, token);
  }
}
