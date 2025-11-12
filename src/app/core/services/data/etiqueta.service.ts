import { Injectable } from "@angular/core";
import { Etiqueta } from "../../models/etiqueta.model";
import { CrudService } from "../../_utils/crud.service";

@Injectable({
  providedIn: "root"
})
export class EtiquetaService extends CrudService<Etiqueta, number> {
  protected endpoint = '/etiquetas';
}
