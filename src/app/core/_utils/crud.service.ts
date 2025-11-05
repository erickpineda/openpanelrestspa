import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TokenStorageService } from '../services/token-storage.service';
import { OpenpanelApiResponse } from '../models/openpanel-api-response.model';

export abstract class CrudService<C> extends BaseService {

    constructor(
        protected http: HttpClient,
        protected override token: TokenStorageService
    ) {
        super(token);
    }

    public listar(): Observable<OpenpanelApiResponse<any>> {
      return this.http.get<OpenpanelApiResponse<any>>(this.path, { headers: this.setHeaders() });
    }

    public listarPagina(pageNo: number, pageSize: number): Observable<OpenpanelApiResponse<any>> {
        const params = { pageNo: pageNo.toString(), pageSize: pageSize.toString() };
        return this.http.get<OpenpanelApiResponse<any>>(this.path, { headers: this.setHeaders(), params });
    }

    public crear(entity: C): Observable<OpenpanelApiResponse<any>> {
        return this.http.post<OpenpanelApiResponse<any>>(this.buildUrl('/crear'), entity, { headers: this.setHeaders() });
    }

    public obtenerPorId(id: number): Observable<OpenpanelApiResponse<any>> {
        return this.http.get<OpenpanelApiResponse<any>>(this.buildUrl(`/obtenerPorId/${id}`), { headers: this.setHeaders() });
    }

    public actualizar(id: number, entity: C): Observable<OpenpanelApiResponse<any>> {
        return this.http.put<OpenpanelApiResponse<any>>(this.buildUrl(`/${id}`), entity, { headers: this.setHeaders() });
    }

    public borrar(id: number): Observable<OpenpanelApiResponse<any>> {
        return this.http.delete<OpenpanelApiResponse<any>>(this.buildUrl(`/${id}`), { headers: this.setHeaders() });
    }

    buscar(req: any, pageNo: number, pageSize: number): Observable<OpenpanelApiResponse<any>> {
      const url = this.buildUrl('/buscar');
      const params = { pageNo: pageNo.toString(), pageSize: pageSize.toString() };
      return this.http.post<OpenpanelApiResponse<any>>(url, req, {
        headers: this.setHeaders(), params
      });
    }

}
