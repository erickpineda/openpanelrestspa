import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Rol } from "../models/rol.model";
import { CrudService } from "../_utils/crud.service";
import { TokenStorageService } from "./token-storage.service";

@Injectable({
  providedIn: "root"
})
export class RolService extends CrudService<Rol> {
  protected resource = '/roles';

  constructor(
    protected override http: HttpClient,
    protected override token: TokenStorageService) {
    super(http, token);
  }
}
