// core/services/data/categoria.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Categoria } from '../../models/categoria.model';
import { CrudService } from '../../_utils/crud.service';
import { HttpContext } from '@angular/common/http';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';
import { PaginaResponse } from '../../models/pagina-response.model';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService extends CrudService<Categoria, number> {
  protected endpoint = '/categorias';
  protected override pageSizeParam = OPConstants.Pagination.PAGE_SIZE_PARAM;

  buscarSafe(searchRequest: any, pageNo: number, size: number): Observable<PaginaResponse> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = pageNo.toString();
    params[this.pageSizeParam] = size.toString();
    const context = new HttpContext();
    return this.safePostData<PaginaResponse>(
      `${this.endpoint}/buscar`,
      searchRequest,
      new PaginaResponse(),
      params,
      undefined,
      'categorias.buscar',
      context
    );
  }

  buscarSinGlobalLoader(
    searchRequest: any,
    pageNo: number,
    pageSize: number
  ): Observable<PaginaResponse> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = pageNo.toString();
    params[this.pageSizeParam] = pageSize.toString();
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.safePostData<PaginaResponse>(
      `${this.endpoint}/buscar`,
      searchRequest,
      new PaginaResponse(),
      params,
      undefined,
      'categorias.buscar',
      context
    );
  }
}
