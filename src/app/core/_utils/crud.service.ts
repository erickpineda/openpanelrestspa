import { BaseService } from './base.service';
import { Observable, Subscriber } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TokenStorageService } from '../services/token-storage.service';

export abstract class CrudService<C> extends BaseService {

    constructor(
        protected http: HttpClient,
        protected override token: TokenStorageService
    ) {
        super(token);
    }

    public listar(): Observable<C[]> {
        const url = `${this.path}`;
        return this.http.get<C[]>(url, { observe: 'body', headers: this.setHeaders(), responseType: 'json' });
    }

    public crear(entity: C): Observable<C> {
        const url = `${this.path}/crear`;
        return this.http.post<C>(url, entity, { headers: this.setHeaders() });
    }

    public obtenerPorId(id: number): Observable<C> {
        const url = `${this.path}/${id}`;
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
