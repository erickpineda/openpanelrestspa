import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EtiquetaDTO {
  id?: number;
  nombre?: string;
  descripcion?: string;
  color?: string;
  creadoPor?: number;
  fechaCreacion?: string;
  modificadoPor?: number;
  fechaModificacion?: string;
}

export interface AsociacionEtiquetaDTO {
  etiquetaId: number;
  entidadId: number;
  tipoEntidad: 'ENTRADA' | 'CATEGORIA';
}

@Injectable({ providedIn: 'root' })
export class EtiquetasService {
  private base = `${environment.backend.host}${environment.backend.uri}/etiquetas`;

  constructor(private http: HttpClient) {}

  listar(pageNo?: number, pageSize?: number): Observable<any> {
    let params = new HttpParams();
    if (pageNo != null) params = params.set('pageNo', String(pageNo));
    if (pageSize != null) params = params.set('pageSize', String(pageSize));
    return this.http.get(this.base, { params });
  }

  obtenerPorId(id: number): Observable<any> {
    return this.http.get(`${this.base}/obtenerPorId/${id}`);
  }

  crear(etiqueta: EtiquetaDTO): Observable<any> {
    return this.http.post(`${this.base}/crear`, etiqueta);
  }

  actualizar(id: number, etiqueta: EtiquetaDTO): Observable<any> {
    return this.http.put(`${this.base}/${id}`, etiqueta);
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

  asociarConEntrada(etiquetaId: number, entradaId: number): Observable<any> {
    const asociacion: AsociacionEtiquetaDTO = {
      etiquetaId,
      entidadId: entradaId,
      tipoEntidad: 'ENTRADA'
    };
    return this.http.post(`${this.base}/asociar`, asociacion);
  }

  asociarConCategoria(etiquetaId: number, categoriaId: number): Observable<any> {
    const asociacion: AsociacionEtiquetaDTO = {
      etiquetaId,
      entidadId: categoriaId,
      tipoEntidad: 'CATEGORIA'
    };
    return this.http.post(`${this.base}/asociar`, asociacion);
  }

  desasociarDeEntrada(etiquetaId: number, entradaId: number): Observable<any> {
    return this.http.delete(`${this.base}/desasociar/ENTRADA/${etiquetaId}/${entradaId}`);
  }

  desasociarDeCategoria(etiquetaId: number, categoriaId: number): Observable<any> {
    return this.http.delete(`${this.base}/desasociar/CATEGORIA/${etiquetaId}/${categoriaId}`);
  }

  obtenerEtiquetasPorEntrada(entradaId: number): Observable<any> {
    return this.http.get(`${this.base}/porEntrada/${entradaId}`);
  }

  obtenerEtiquetasPorCategoria(categoriaId: number): Observable<any> {
    return this.http.get(`${this.base}/porCategoria/${categoriaId}`);
  }
}