// core/services/data/categoria.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Categoria } from '../../models/categoria.model';
import { CrudService } from '../../_utils/crud.service';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';
import { PaginaResponse } from '../../models/pagina-response.model';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService extends CrudService<Categoria, number> {
  protected endpoint = OPConstants.Methods.CATEGORIAS.BASE;
  protected override pageSizeParam = OPConstants.Pagination.PAGE_SIZE_PARAM;

  buscarSafe(searchRequest: any, pageNo: number, size: number): Observable<PaginaResponse> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = pageNo.toString();
    params[this.pageSizeParam] = size.toString();
    const context = new HttpContext();
    return this.safePostData<PaginaResponse>(
      OPConstants.Methods.CATEGORIAS.BUSCAR,
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
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.safePostData<PaginaResponse>(
      OPConstants.Methods.CATEGORIAS.BUSCAR,
      searchRequest,
      new PaginaResponse(),
      params,
      undefined,
      'categorias.buscar',
      context
    );
  }

  obtenerPorCodigo(codigo: string, context?: HttpContext): Observable<any> {
    return this.get<any>(OPConstants.Methods.CATEGORIAS.OBTENER_POR_CODIGO(codigo), undefined, undefined, context);
  }

  actualizarPorCodigo(codigo: string, categoria: Categoria, context?: HttpContext): Observable<any> {
    return this.put<any>(OPConstants.Methods.CATEGORIAS.ACTUALIZAR_POR_CODIGO(codigo), categoria, undefined, undefined, context);
  }

  borrarPorCodigo(codigo: string, context?: HttpContext): Observable<any> {
    return this.delete<any>(OPConstants.Methods.CATEGORIAS.BORRAR_POR_CODIGO(codigo), undefined, undefined, context);
  }
}
