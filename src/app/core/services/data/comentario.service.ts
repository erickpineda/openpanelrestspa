import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comentario } from '../../models/comentario.model';
import { CrudService } from '../../_utils/crud.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { PaginaResponse } from '../../models/pagina-response.model';
import { HttpContext } from '@angular/common/http';
import { OpenpanelApiResponse } from '../../models/openpanel-api-response.model';

@Injectable({
  providedIn: 'root',
})
export class ComentarioService extends CrudService<Comentario, number> {
  protected endpoint = '/comentarios';

  public override listarPagina(pageNo: number, pageSize: number): Observable<OpenpanelApiResponse<any>> {
    const params = { pageNo: pageNo.toString(), pageSize: pageSize.toString() };
    return this.get<any>(this.endpoint, params);
  }

  buscarSafe(searchRequest: any, page: number, size: number): Observable<PaginaResponse> {
    const params = { pageNo: page.toString(), size: size.toString() };
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
}
