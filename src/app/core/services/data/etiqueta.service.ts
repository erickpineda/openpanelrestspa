import { Injectable } from '@angular/core';
import { Etiqueta } from '../../models/etiqueta.model';
import { CrudService } from '../../_utils/crud.service';
import { Observable } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_LOADER, SKIP_GLOBAL_NOTIFY } from '../../interceptor/network.interceptor';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';

export interface AsociacionEtiquetaDTO {
  etiquetaCodigo: string;
  entidadId: number;
  tipoEntidad: 'ENTRADA' | 'CATEGORIA';
}

@Injectable({
  providedIn: 'root',
})
export class EtiquetaService extends CrudService<Etiqueta, string> {
  protected endpoint = OPConstants.Methods.ETIQUETAS.BASE;
  protected override pageSizeParam = OPConstants.Pagination.PAGE_SIZE_PARAM;

  override listarPagina(pageNo?: number, pageSize?: number): Observable<any> {
    if (pageNo != null && pageSize != null) {
      return super.listarPagina(pageNo, pageSize);
    }
    return super.listarPagina();
  }

  override crear(etiqueta: Etiqueta, context?: HttpContext): Observable<any> {
    return this.post<any>(OPConstants.Methods.ETIQUETAS.CREAR, etiqueta, undefined, undefined, context);
  }

  override listarPaginaSinGlobalLoader(
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
    return this.get<any>(this.endpoint, params, undefined, context);
  }

  buscar(payload: any, pageNo?: number, pageSize?: number, sortField?: string, sortDirection?: string): Observable<any> {
    const params: any = {};
    if (pageNo != null) params[OPConstants.Pagination.PAGE_NO_PARAM] = String(pageNo);
    if (pageSize != null) params[this.pageSizeParam] = String(pageSize);
    if (sortField) {
      params[OPConstants.Pagination.SORT_PARAM] = `${sortField},${sortDirection || 'ASC'}`;
    }
    return this.post<any>(OPConstants.Methods.ETIQUETAS.BUSCAR, payload, params);
  }

  buscarSinGlobalLoader(
    payload: any,
    pageNo?: number,
    pageSize?: number,
    sortField?: string,
    sortDirection?: string
  ): Observable<any> {
    const params: any = {};
    if (pageNo != null) params[OPConstants.Pagination.PAGE_NO_PARAM] = String(pageNo);
    if (pageSize != null) params[this.pageSizeParam] = String(pageSize);
    if (sortField) {
      params[OPConstants.Pagination.SORT_PARAM] = `${sortField},${sortDirection || 'ASC'}`;
    }
    const context = new HttpContext()
      .set(SKIP_GLOBAL_LOADER, true)
      .set(SKIP_GLOBAL_NOTIFY, true);
    return this.post<any>(
      OPConstants.Methods.ETIQUETAS.BUSCAR,
      payload,
      params,
      undefined,
      context
    );
  }

  asociarConEntrada(etiquetaCodigo: string, entradaId: number): Observable<any> {
    const asociacion: AsociacionEtiquetaDTO = {
      etiquetaCodigo,
      entidadId: entradaId,
      tipoEntidad: 'ENTRADA',
    };
    return this.post<any>(`${this.endpoint}/asociar`, asociacion);
  }

  asociarConCategoria(etiquetaCodigo: string, categoriaId: number): Observable<any> {
    const asociacion: AsociacionEtiquetaDTO = {
      etiquetaCodigo,
      entidadId: categoriaId,
      tipoEntidad: 'CATEGORIA',
    };
    return this.post<any>(`${this.endpoint}/asociar`, asociacion);
  }

  desasociarDeEntrada(etiquetaCodigo: string, entradaId: number): Observable<any> {
    return this.delete<any>(`${this.endpoint}/desasociar/ENTRADA/${etiquetaCodigo}/${entradaId}`);
  }

  desasociarDeCategoria(etiquetaCodigo: string, categoriaId: number): Observable<any> {
    return this.delete<any>(`${this.endpoint}/desasociar/CATEGORIA/${etiquetaCodigo}/${categoriaId}`);
  }

  obtenerEtiquetasPorEntrada(entradaId: number): Observable<any> {
    return this.get<any>(`${this.endpoint}/porEntrada/${entradaId}`);
  }

  obtenerEtiquetasPorCategoria(categoriaId: number): Observable<any> {
    return this.get<any>(`${this.endpoint}/porCategoria/${categoriaId}`);
  }

  obtenerPorCodigo(codigo: string): Observable<any> {
    return this.get<any>(OPConstants.Methods.ETIQUETAS.OBTENER_POR_CODIGO(codigo));
  }

  actualizarPorCodigo(
    codigo: string,
    etiqueta: Etiqueta,
    context?: HttpContext
  ): Observable<any> {
    return this.put<any>(
      OPConstants.Methods.ETIQUETAS.ACTUALIZAR_POR_CODIGO(codigo),
      etiqueta,
      undefined,
      undefined,
      context
    );
  }

  borrarPorCodigo(codigo: string, context?: HttpContext): Observable<any> {
    return this.delete<any>(
      OPConstants.Methods.ETIQUETAS.BORRAR_POR_CODIGO(codigo),
      undefined,
      undefined,
      context
    );
  }
}
