import { Injectable } from "@angular/core";
import { Etiqueta } from "../../models/etiqueta.model";
import { CrudService } from "../../_utils/crud.service";
import { Observable } from "rxjs";
import { HttpContext } from '@angular/common/http';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';

export interface AsociacionEtiquetaDTO {
  etiquetaId: number;
  entidadId: number;
  tipoEntidad: 'ENTRADA' | 'CATEGORIA';
}

@Injectable({
  providedIn: "root"
})
export class EtiquetaService extends CrudService<Etiqueta, number> {
  protected endpoint = '/etiquetas';

  override listar(pageNo?: number, pageSize?: number): Observable<any> {
    if (pageNo != null && pageSize != null) {
      return this.listarPagina(pageNo, pageSize);
    }
    return super.listar();
  }

  public override listarPagina(pageNo: number, pageSize: number): Observable<any> {
    const params = { pageNo: pageNo.toString(), pageSize: pageSize.toString() };
    return this.get<any>(this.endpoint, params);
  }

  listarPaginaSinGlobalLoader(pageNo: number, pageSize: number): Observable<any> {
    const params = { pageNo: String(pageNo), pageSize: String(pageSize) };
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.get<any>(this.endpoint, params, undefined, context);
  }

  override obtenerPorId(id: number): Observable<any> {
    return super.obtenerPorId(id);
  }

  override crear(etiqueta: Etiqueta): Observable<any> {
    return this.post<any>(`${this.endpoint}/crear`, etiqueta);
  }

  override actualizar(id: number, etiqueta: Etiqueta): Observable<any> {
    return this.put<any>(`${this.endpoint}/${id}`, etiqueta);
  }

  override borrar(id: number): Observable<any> {
    return this.delete<any>(`${this.endpoint}/${id}`);
  }

  buscar(payload: any, pageNo?: number, pageSize?: number): Observable<any> {
    const params: any = {};
    if (pageNo != null) params.pageNo = String(pageNo);
    if (pageSize != null) params.pageSize = String(pageSize);
    return this.post<any>(`${this.endpoint}/buscar`, payload, params);
  }

  buscarSinGlobalLoader(payload: any, pageNo?: number, pageSize?: number): Observable<any> {
    const params: any = {};
    if (pageNo != null) params.pageNo = String(pageNo);
    if (pageSize != null) params.pageSize = String(pageSize);
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.post<any>(`${this.endpoint}/buscar`, payload, params, undefined, context);
  }

  asociarConEntrada(etiquetaId: number, entradaId: number): Observable<any> {
    const asociacion: AsociacionEtiquetaDTO = { etiquetaId, entidadId: entradaId, tipoEntidad: 'ENTRADA' };
    return this.post<any>(`${this.endpoint}/asociar`, asociacion);
  }

  asociarConCategoria(etiquetaId: number, categoriaId: number): Observable<any> {
    const asociacion: AsociacionEtiquetaDTO = { etiquetaId, entidadId: categoriaId, tipoEntidad: 'CATEGORIA' };
    return this.post<any>(`${this.endpoint}/asociar`, asociacion);
  }

  desasociarDeEntrada(etiquetaId: number, entradaId: number): Observable<any> {
    return this.delete<any>(`${this.endpoint}/desasociar/ENTRADA/${etiquetaId}/${entradaId}`);
  }

  desasociarDeCategoria(etiquetaId: number, categoriaId: number): Observable<any> {
    return this.delete<any>(`${this.endpoint}/desasociar/CATEGORIA/${etiquetaId}/${categoriaId}`);
  }

  obtenerEtiquetasPorEntrada(entradaId: number): Observable<any> {
    return this.get<any>(`${this.endpoint}/porEntrada/${entradaId}`);
  }

  obtenerEtiquetasPorCategoria(categoriaId: number): Observable<any> {
    return this.get<any>(`${this.endpoint}/porCategoria/${categoriaId}`);
  }
}
