import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from '../../_utils/crud.service';
import { TipoEntrada } from '../../models/tipo-entrada.model';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';

@Injectable({
  providedIn: 'root',
})
export class TipoEntradaService extends CrudService<TipoEntrada, number> {
  protected endpoint = OPConstants.Methods.TIPOS_ENTRADAS.BASE;
  protected override pageSizeParam = OPConstants.Pagination.PAGE_SIZE_PARAM;

  override listarPagina(pageNo?: number, pageSize?: number): Observable<any> {
    const params: any = {};
    if (pageNo != null) params[OPConstants.Pagination.PAGE_NO_PARAM] = String(pageNo);
    if (pageSize != null) params[this.pageSizeParam] = String(pageSize);
    return this.get<any>(this.endpoint, params);
  }

  override listarPaginaSinGlobalLoader(pageNo: number, pageSize: number): Observable<any> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = String(pageNo);
    params[this.pageSizeParam] = String(pageSize);
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.get<any>(this.endpoint, params, undefined, context);
  }

  override obtenerPorId(id: number): Observable<any> {
    return super.obtenerPorId(id);
  }

  override crear(entity: TipoEntrada): Observable<any> {
    return super.crear(entity);
  }

  override actualizar(id: number, entity: TipoEntrada): Observable<any> {
    return super.actualizar(id, entity);
  }

  override borrar(id: number): Observable<any> {
    return super.borrar(id);
  }

  obtenerPorCodigo(codigo: string): Observable<any> {
    return this.get<any>(OPConstants.Methods.TIPOS_ENTRADAS.OBTENER_POR_CODIGO(codigo));
  }

  actualizarPorCodigo(codigo: string, entity: TipoEntrada): Observable<any> {
    return this.put<any>(OPConstants.Methods.TIPOS_ENTRADAS.ACTUALIZAR_POR_CODIGO(codigo), entity);
  }

  borrarPorCodigo(codigo: string): Observable<any> {
    return this.delete<any>(OPConstants.Methods.TIPOS_ENTRADAS.BORRAR_POR_CODIGO(codigo));
  }
}
