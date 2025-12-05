// core/services/data/categoria.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Categoria } from '../../models/categoria.model';
import { CrudService } from '../../_utils/crud.service';
import { HttpContext } from '@angular/common/http';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';
import { PaginaResponse } from '../../models/pagina-response.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService extends CrudService<Categoria, number> {
  protected endpoint = '/categorias';

  listarSinGlobalLoader(): Observable<Categoria[]> {
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.safeGetList<Categoria>(this.endpoint, undefined, undefined, 'categorias.listar', context);
  }

  buscarSafe(searchRequest: any, pageNo: number, size: number): Observable<PaginaResponse> {
    const params = { pageNo: pageNo.toString(), pageSize: size.toString() };
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

  public override listarPagina(pageNo: number, pageSize: number) {
    const params = { pageNo: pageNo.toString(), pageSize: pageSize.toString() };
    return this.get<any>(this.endpoint, params);
  }

  listarPaginaSinGlobalLoader(pageNo: number, pageSize: number): Observable<any> {
    const params = { pageNo: pageNo.toString(), pageSize: pageSize.toString() };
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.get<any>(this.endpoint, params, undefined, context);
  }

  buscarSinGlobalLoader(searchRequest: any, pageNo: number, pageSize: number): Observable<PaginaResponse> {
    const params = { pageNo: pageNo.toString(), pageSize: pageSize.toString() };
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
