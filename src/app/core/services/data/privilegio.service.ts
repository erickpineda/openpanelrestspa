import { Injectable } from "@angular/core";
import { Privilegio } from "../../models/privilegio.model";
import { CrudService } from "../../_utils/crud.service";

@Injectable({
  providedIn: "root"
})
export class PrivilegioService extends CrudService<Privilegio, number> {
  protected override endpoint = '/privilegios';
}
