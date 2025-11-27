import { Injectable } from "@angular/core";
import { Rol } from "../../models/rol.model";
import { CrudService } from "../../_utils/crud.service";

@Injectable({
  providedIn: "root"
})
export class RolService extends CrudService<Rol, number> {
  protected override endpoint = '/roles';

}
