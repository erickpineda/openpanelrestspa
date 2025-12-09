import { Injectable } from "@angular/core";
import { Rol } from "../../models/rol.model";
import { CrudService } from "../../_utils/crud.service";
import { HttpContext } from "@angular/common/http";
import { Observable } from "rxjs";
import { NetworkInterceptor } from "../../interceptor/network.interceptor";
import { OPConstants } from "../../../shared/constants/op-global.constants";

@Injectable({
  providedIn: "root"
})
export class RolService extends CrudService<Rol, number> {
  protected override endpoint = '/roles';

  buscarSinGlobalLoader(searchRequest: any, pageNo: number, pageSize: number): Observable<any> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = pageNo.toString();
    params[this.pageSizeParam] = pageSize.toString();
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.post<any>(`${this.endpoint}/buscar`, searchRequest, params, undefined, context);
  }

  obtenerPrivilegios(codigo: string): Observable<any> {
    return this.get<any>(`${this.endpoint}/obtenerPrivilegios/${codigo}`);
  }

}
