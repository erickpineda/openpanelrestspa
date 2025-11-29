import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RolDTO { id?: number; nombre?: string; descripcion?: string }

@Injectable({ providedIn: 'root' })
export class RolesService {
  private base = `${environment.backend.host}${environment.backend.uri}/roles`;

  constructor(private http: HttpClient) {}

  listar(pageNo?: number, pageSize?: number): Observable<any> {
    let params = new HttpParams();
    if (pageNo != null) params = params.set('pageNo', String(pageNo));
    if (pageSize != null) params = params.set('pageSize', String(pageSize));
    return this.http.get(this.base, { params });
  }
}

