import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NetworkInterceptor } from '../interceptor/network.interceptor';

export interface UsuarioDTO {
  idUsuario?: number;
  idRol?: number;
  username?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  genero?: string;
  telefono?: number;
  emailConfirmado?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private base = `${environment.backend.host}${environment.backend.uri}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(pageNo?: number, pageSize?: number): Observable<any> {
    let params = new HttpParams();
    if (pageNo != null) params = params.set('pageNo', String(pageNo));
    if (pageSize != null) params = params.set('pageSize', String(pageSize));
    return this.http.get(this.base, { params });
  }

  listarSinGlobalLoader(pageNo?: number, pageSize?: number): Observable<any> {
    let params = new HttpParams();
    if (pageNo != null) params = params.set('pageNo', String(pageNo));
    if (pageSize != null) params = params.set('pageSize', String(pageSize));
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.http.get(this.base, { params, context });
  }

  obtenerPorId(id: number): Observable<any> {
    return this.http.get(`${this.base}/obtenerPorId/${id}`);
  }

  crear(usuario: UsuarioDTO): Observable<any> {
    return this.http.post(`${this.base}/crear`, usuario);
  }

  actualizar(id: number, usuario: UsuarioDTO): Observable<any> {
    return this.http.put(`${this.base}/${id}`, usuario);
  }

  borrar(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }

  buscar(payload: any, pageNo?: number, pageSize?: number): Observable<any> {
    let params = new HttpParams();
    if (pageNo != null) params = params.set('pageNo', String(pageNo));
    if (pageSize != null) params = params.set('pageSize', String(pageSize));
    return this.http.post(`${this.base}/buscar`, payload, { params });
  }

  buscarSinGlobalLoader(payload: any, pageNo?: number, pageSize?: number): Observable<any> {
    let params = new HttpParams();
    if (pageNo != null) params = params.set('pageNo', String(pageNo));
    if (pageSize != null) params = params.set('pageSize', String(pageSize));
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.http.post(`${this.base}/buscar`, payload, { params, context });
  }
}
