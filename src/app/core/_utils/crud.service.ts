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

    public listarPagina(pageNo: number, pageSize: number): Observable<OpenpanelApiResponse<C[]>> {
        const params = { pageNo: pageNo.toString(), pageSize: pageSize.toString() };
        return this.http.get<OpenpanelApiResponse<C[]>>(this.path, { headers: this.setHeaders(), params });
    }

    public crear(entity: C): Observable<OpenpanelApiResponse<C>> {
        return this.http.post<OpenpanelApiResponse<C>>(this.buildUrl('/crear'), entity, { headers: this.setHeaders() });
    }

    public obtenerPorId(id: number): Observable<OpenpanelApiResponse<C>> {
        return this.http.get<OpenpanelApiResponse<C>>(this.buildUrl(`/obtenerPorId/${id}`), { headers: this.setHeaders() });
    }

    public actualizar(id: number, entity: C): Observable<OpenpanelApiResponse<C>> {
        return this.http.put<OpenpanelApiResponse<C>>(this.buildUrl(`/${id}`), entity, { headers: this.setHeaders() });
    }

    public borrar(id: number): Observable<OpenpanelApiResponse<C>> {
        return this.http.delete<OpenpanelApiResponse<C>>(this.buildUrl(`/${id}`), { headers: this.setHeaders() });
    }

}
