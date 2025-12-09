import { Injectable } from "@angular/core";
import { Privilegio } from "../../models/privilegio.model";
import { CrudService } from "../../_utils/crud.service";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class PrivilegioService extends CrudService<Privilegio, string> {
  protected override endpoint = '/privilegios';

  override obtenerPorId(id: string): Observable<any> {
    return this.get<any>(`${this.endpoint}/obtenerPorCodigo/${id}`);
  }

  override actualizar(id: string, entity: Privilegio): Observable<any> {
    return this.put<any>(`${this.endpoint}/actualizarPorCodigo/${id}`, entity);
  }

  override borrar(id: string): Observable<any> {
    return this.delete<any>(`${this.endpoint}/borrarPorCodigo/${id}`);
  }
}
