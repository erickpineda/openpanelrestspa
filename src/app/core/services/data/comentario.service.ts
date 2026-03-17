import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comentario } from '../../models/comentario.model';
import { CrudService } from '../../_utils/crud.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { PaginaResponse } from '../../models/pagina-response.model';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';
import { OpenpanelApiResponse } from '../../models/openpanel-api-response.model';
import { OPConstants } from '../../../shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class ComentarioService extends CrudService<Comentario, number> {
  protected endpoint = OPConstants.Methods.COMENTARIOS.BASE;
  protected override pageSizeParam = OPConstants.Pagination.PAGE_SIZE_PARAM;

  buscarSafe(
    searchRequest: any,
    page: number,
    size: number,
    sortField?: string,
    sortDirection?: string
  ): Observable<PaginaResponse> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = page.toString();
    params[this.pageSizeParam] = size.toString();
    if (sortField) {
      params[OPConstants.Pagination.SORT_PARAM] = `${sortField},${sortDirection || 'ASC'}`;
    }
    const context = new HttpContext();
    return this.safePostData<PaginaResponse>(
      OPConstants.Methods.COMENTARIOS.BUSCAR,
      searchRequest,
      new PaginaResponse(),
      params,
      undefined,
      'comentarios.buscar',
      context
    );
  }

  buscarSinGlobalLoader(
    searchRequest: any,
    page: number,
    size: number,
    sortField?: string,
    sortDirection?: string
  ): Observable<PaginaResponse> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = page.toString();
    params[this.pageSizeParam] = size.toString();
    if (sortField) {
      params[OPConstants.Pagination.SORT_PARAM] = `${sortField},${sortDirection || 'ASC'}`;
    }
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.safePostData<PaginaResponse>(
      OPConstants.Methods.COMENTARIOS.BUSCAR,
      searchRequest,
      new PaginaResponse(),
      params,
      undefined,
      'comentarios.buscar',
      context
    );
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

  listarPorIdEntrada(idEntrada: number, page: number, size: number): Observable<PaginaResponse> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = page.toString();
    params[this.pageSizeParam] = size.toString();
    return this.safeGetData<PaginaResponse>(
      OPConstants.Methods.COMENTARIOS.LISTAR_POR_ID_ENTRADA(idEntrada),
      new PaginaResponse(),
      params,
      undefined,
      'comentarios.listarPorIdEntrada'
    );
  }
}
