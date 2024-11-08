import { BaseService } from './base.service';
import { Observable, Subscriber } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { TokenStorageService } from '../services/token-storage.service';
import { PaginaResponse } from '../models/pagina-response.model';

export abstract class CrudService<C> extends BaseService {

    constructor(
        protected http: HttpClient,
        protected override token: TokenStorageService
    ) {
        super(token);
    }

    public listar(): Observable<PaginaResponse> {
        const url = `${this.path}`;
        return this.http.get<PaginaResponse>(url, { observe: 'body', headers: this.setHeaders(), responseType: 'json' });
    }

    public listarPagina(pageNo: number, pageSize: number): Observable<PaginaResponse> {
        let params = new HttpParams();
        params = params.append('pageNo', pageNo.toString());
        params = params.append('pageSize', pageSize.toString());
        const url = `${this.path}?${params.toString()}`;
        return this.http.get<PaginaResponse>(url, { observe: 'body', headers: this.setHeaders(), responseType: 'json' });
    }

    public crear(entity: C): Observable<C> {
        const url = `${this.path}/crear`;
        return this.http.post<C>(url, entity, { headers: this.setHeaders() });
    }

    public obtenerPorId(id: number): Observable<C> {
        const url = `${this.path}/obtenerPorId/${id}`;
        return this.http.get<C>(url, { observe: 'body', headers: this.setHeaders() });
    }

    public actualizar(id: number, entity: C): Observable<C> {
        const url = `${this.path}/${id}`;
        return this.http.put<C>(url, entity, { headers: this.setHeaders() });
    }

    public borrar(id: number): Observable<C> {
        const url = `${this.path}/${id}`;
        return this.http.delete<C>(url, { headers: this.setHeaders() });
    }

}
