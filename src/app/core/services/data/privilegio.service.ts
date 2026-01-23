import { Injectable } from '@angular/core';
import { Privilegio } from '../../models/privilegio.model';
import { CrudService } from '../../_utils/crud.service';
import { Observable } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';
import { OPConstants } from '../../../shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class PrivilegioService extends CrudService<Privilegio, string> {
  protected override endpoint = '/privilegios';

  buscarSinGlobalLoader(searchRequest: any, pageNo: number, pageSize: number): Observable<any> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = pageNo.toString();
    params[this.pageSizeParam] = pageSize.toString();
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.post<any>(`${this.endpoint}/buscar`, searchRequest, params, undefined, context);
  }

  override obtenerPorId(id: string, context?: HttpContext): Observable<any> {
    return this.get<any>(`${this.endpoint}/obtenerPorCodigo/${id}`, undefined, undefined, context);
  }

  override actualizar(id: string, entity: Privilegio, context?: HttpContext): Observable<any> {
    return this.put<any>(
      `${this.endpoint}/actualizarPorCodigo/${id}`,
      entity,
      undefined,
      undefined,
      context
    );
  }

  override borrar(id: string, context?: HttpContext): Observable<any> {
    return this.delete<any>(
      `${this.endpoint}/borrarPorCodigo/${id}`,
      undefined,
      undefined,
      context
    );
  }
}
