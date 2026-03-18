import { Injectable } from '@angular/core';
import { Rol } from '../../models/rol.model';
import { CrudService } from '../../_utils/crud.service';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';
import { OPConstants } from '../../../shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class RolService extends CrudService<Rol, string> {
  protected override endpoint = '/roles';

  buscarSinGlobalLoader(
    searchRequest: any,
    pageNo: number,
    pageSize: number,
    sortField?: string,
    sortDirection?: string
  ): Observable<any> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = pageNo.toString();
    params[this.pageSizeParam] = pageSize.toString();
    if (sortField) {
      params[OPConstants.Pagination.SORT_PARAM] = `${sortField},${sortDirection || 'ASC'}`;
    }
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.post<any>(`${this.endpoint}/buscar`, searchRequest, params, undefined, context);
  }

  obtenerPrivilegios(codigo: string): Observable<any> {
    return this.get<any>(`${this.endpoint}/obtenerPrivilegios/${codigo}`);
  }

  obtenerPorCodigos(codigos: string[], pageNo: number = 0, pageSize: number = 50): Observable<any> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = pageNo.toString();
    params[this.pageSizeParam] = pageSize.toString();
    const payload = { codigosRol: codigos };
    return this.post<any>(`${this.endpoint}/obtenerPorCodigos`, payload, params);
  }

  // Overrides for code-based endpoints
  override obtenerPorId(codigo: string, context?: HttpContext): Observable<any> {
    return this.get<any>(
      `${this.endpoint}/obtenerPorCodigo/${codigo}`,
      undefined,
      undefined,
      context
    );
  }

  override actualizar(codigo: string, entity: Rol, context?: HttpContext): Observable<any> {
    return this.put<any>(
      `${this.endpoint}/actualizarPorCodigo/${codigo}`,
      entity,
      undefined,
      undefined,
      context
    );
  }

  override borrar(codigo: string, context?: HttpContext): Observable<any> {
    return this.delete<any>(
      `${this.endpoint}/borrarPorCodigo/${codigo}`,
      undefined,
      undefined,
      context
    );
  }

  // Safe overrides
  override obtenerPorIdSafe(codigo: string): Observable<Rol> {
    return this.safeGetData<Rol>(
      `${this.endpoint}/obtenerPorCodigo/${codigo}`,
      {} as Rol,
      undefined,
      undefined,
      `${this.endpoint}.obtenerPorCodigo`
    );
  }

  override actualizarSafe(codigo: string, entity: Rol): Observable<Rol> {
    return this.safePutData<Rol>(
      `${this.endpoint}/actualizarPorCodigo/${codigo}`,
      entity,
      {} as Rol,
      undefined,
      undefined,
      `${this.endpoint}.actualizarPorCodigo`
    );
  }

  override eliminarSafe(codigo: string): Observable<boolean> {
    return this.safeDeleteOperation(
      `${this.endpoint}/borrarPorCodigo/${codigo}`,
      undefined,
      undefined,
      `${this.endpoint}.borrarPorCodigo`
    );
  }

  actualizarPrivilegios(codigo: string, codigosPrivilegios: string[]): Observable<any> {
    const payload = { codigosPrivilegios };
    return this.put<any>(`${this.endpoint}/actualizarPrivilegios/${codigo}`, payload);
  }
}
