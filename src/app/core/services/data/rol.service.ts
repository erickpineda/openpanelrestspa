import { Injectable } from '@angular/core';
import { Rol } from '../../models/rol.model';
import { CrudService } from '../../_utils/crud.service';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';
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
  ): Observable<any> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = pageNo.toString();
    params[this.pageSizeParam] = pageSize.toString();
    const context = new HttpContext().set(
      NetworkInterceptor.SKIP_GLOBAL_LOADER,
      true,
    );
    return this.post<any>(
      `${this.endpoint}/buscar`,
      searchRequest,
      params,
      undefined,
      context,
    );
  }

  obtenerPrivilegios(codigo: string): Observable<any> {
    return this.get<any>(`${this.endpoint}/obtenerPrivilegios/${codigo}`);
  }

  obtenerPorCodigos(
    codigos: string[],
    pageNo: number = 0,
    pageSize: number = 50,
  ): Observable<any> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = pageNo.toString();
    params[this.pageSizeParam] = pageSize.toString();
    const payload = { codigosRol: codigos };
    return this.post<any>(
      `${this.endpoint}/obtenerPorCodigos`,
      payload,
      params,
    );
  }

  // Overrides for code-based endpoints
  override obtenerPorId(id: string): Observable<any> {
    return this.get<any>(`${this.endpoint}/obtenerPorCodigo/${id}`);
  }

  override actualizar(id: string, entity: Rol): Observable<any> {
    return this.put<any>(`${this.endpoint}/actualizarPorCodigo/${id}`, entity);
  }

  override borrar(id: string): Observable<any> {
    return this.delete<any>(`${this.endpoint}/borrarPorCodigo/${id}`);
  }

  // Safe overrides
  override obtenerPorIdSafe(id: string): Observable<Rol> {
    return this.safeGetData<Rol>(
      `${this.endpoint}/obtenerPorCodigo/${id}`,
      {} as Rol,
      undefined,
      undefined,
      `${this.endpoint}.obtenerPorCodigo`,
    );
  }

  override actualizarSafe(id: string, entity: Rol): Observable<Rol> {
    return this.safePutData<Rol>(
      `${this.endpoint}/actualizarPorCodigo/${id}`,
      entity,
      {} as Rol,
      undefined,
      undefined,
      `${this.endpoint}.actualizarPorCodigo`,
    );
  }

  override eliminarSafe(id: string): Observable<boolean> {
    return this.safeDeleteOperation(
      `${this.endpoint}/borrarPorCodigo/${id}`,
      undefined,
      undefined,
      `${this.endpoint}.borrarPorCodigo`,
    );
  }

  actualizarPrivilegios(
    codigo: string,
    codigosPrivilegios: string[],
  ): Observable<any> {
    const payload = { codigosPrivilegios };
    return this.put<any>(
      `${this.endpoint}/actualizarPrivilegios/${codigo}`,
      payload,
    );
  }
}
