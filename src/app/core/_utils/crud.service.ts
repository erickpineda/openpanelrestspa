import { BaseService } from './base.service';
import { catchError, Observable, Subscriber, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { TokenStorageService } from '../services/token-storage.service';
import { OpenpanelApiResponse } from '../models/openpanel-api-response.model';

export abstract class CrudService<C> extends BaseService {

    constructor(
        protected http: HttpClient,
        protected override token: TokenStorageService
    ) {
        super(token);
    }

    public listar(): Observable<OpenpanelApiResponse<C[]>> {
        const url = `${this.path}`;
        return this.http.get<OpenpanelApiResponse<C[]>>(url, { observe: 'body', headers: this.setHeaders(), responseType: 'json' });
    }

    public listarPagina(pageNo: number, pageSize: number): Observable<OpenpanelApiResponse<any>> {
        let params = new HttpParams();
        params = params.append('pageNo', pageNo.toString());
        params = params.append('pageSize', pageSize.toString());
        const url = `${this.path}`;
        return this.http.get<OpenpanelApiResponse<any>>(url, { observe: 'body', headers: this.setHeaders(), responseType: 'json' });
    }    

    public crear(entity: C): Observable<OpenpanelApiResponse<any>> {
        const url = `${this.path}/crear`;
        return this.http.post<OpenpanelApiResponse<any>>(url, entity, { headers: this.setHeaders() });
    }

    public obtenerPorId(id: number): Observable<OpenpanelApiResponse<C>> {
        const url = `${this.path}/obtenerPorId/${id}`;
        return this.http.get<OpenpanelApiResponse<C>>(url, { observe: 'body', headers: this.setHeaders() })
            .pipe(catchError(this.handleError));;
    }

    public actualizar(id: number, entity: C): Observable<OpenpanelApiResponse<any>> {
        const url = `${this.path}/${id}`;
        return this.http.put<OpenpanelApiResponse<any>>(url, entity, { headers: this.setHeaders() });
    }

    public borrar(id: number): Observable<OpenpanelApiResponse<any>> {
        const url = `${this.path}/${id}`;
        return this.http.delete<OpenpanelApiResponse<any>>(url, { headers: this.setHeaders() });
    }

    protected handleError(error: any): Observable<never> {
        console.error('An error occurred:', error);
        return throwError(() => new Error('Something bad happened; please try again later.'));
    }

}
