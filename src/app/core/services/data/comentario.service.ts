import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comentario } from '../../models/comentario.model';
import { CrudService } from '../../_utils/crud.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { PaginaResponse } from '../../models/pagina-response.model';
import { HttpContext } from '@angular/common/http';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';
import { OpenpanelApiResponse } from '../../models/openpanel-api-response.model';

@Injectable({
  providedIn: 'root',
})
export class ComentarioService extends CrudService<Comentario, number> {
  protected endpoint = '/comentarios';
  protected override pageSizeParam = 'pageSize';

  buscarSafe(searchRequest: any, page: number, size: number): Observable<PaginaResponse> {
    const params = { pageNo: page.toString(), pageSize: size.toString() };
    const context = new HttpContext();
    return this.safePostData<PaginaResponse>(
      `${this.endpoint}/buscar`,
      searchRequest,
      new PaginaResponse(),
      params,
      undefined,
      'comentarios.buscar',
      context
    );
  }

  buscarSinGlobalLoader(searchRequest: any, page: number, size: number): Observable<PaginaResponse> {
    const params = { pageNo: page.toString(), pageSize: size.toString() };
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.safePostData<PaginaResponse>(
      `${this.endpoint}/buscar`,
      searchRequest,
      new PaginaResponse(),
      params,
      undefined,
      'comentarios.buscar',
      context
    );
  }
}
