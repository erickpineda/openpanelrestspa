// core/_utils/crud.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { OpenpanelApiResponse } from '../models/openpanel-api-response.model';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_LOADER } from '../interceptor/network.interceptor';
import { OPConstants } from '../../shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export abstract class CrudService<T, ID> extends BaseService {
  protected abstract endpoint: string;
  protected pageSizeParam: string = OPConstants.Pagination.PAGE_SIZE_PARAM;

  constructor(
    protected override http: HttpClient,
    protected override tokenStorageService: TokenStorageService
  ) {
    super(http, tokenStorageService);
  }

  /**
   * Lista elementos de forma segura, retornando array vacío en caso de error
   */
  listarSafe(pageNo?: number, pageSize?: number): Observable<T[]> {
    const params: any = {};
    if (pageNo != null) params[OPConstants.Pagination.PAGE_NO_PARAM] = String(pageNo);
    if (pageSize != null) params[this.pageSizeParam] = String(pageSize);

    return this.safeGetList<T>(this.endpoint, params, undefined, `${this.endpoint}.listar`);
  }

  /**
   * Lista elementos de forma segura sin loader global
   */
  listarSafeSinGlobalLoader(pageNo?: number, pageSize?: number): Observable<T[]> {
    const params: any = {};
    if (pageNo != null) params[OPConstants.Pagination.PAGE_NO_PARAM] = String(pageNo);
    if (pageSize != null) params[this.pageSizeParam] = String(pageSize);

    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.safeGetList<T>(
      this.endpoint,
      params,
      undefined,
      `${this.endpoint}.listar`,
      context
    );
  }

  /**
   * Obtiene un elemento por ID de forma segura, retornando null en caso de error
   */
  obtenerPorIdSafe(id: ID, context?: HttpContext): Observable<T> {
    return this.safeGetData<T>(
      `${this.endpoint}/obtenerPorId/${id}`,
      {} as T, // ✅ Cast simple a T
      undefined,
      undefined,
      `${this.endpoint}.obtenerPorId`,
      context
    );
  }

  /**
   * Crea un elemento de forma segura, retornando null en caso de error
   */
  crearSafe(entity: T, context?: HttpContext): Observable<T> {
    return this.safePostData<T>(
      `${this.endpoint}/crear`,
      entity,
      {} as T, // ✅ Cast simple a T
      undefined,
      undefined,
      `${this.endpoint}.crear`,
      context
    );
  }

  /**
   * Crear elemento con estado
   */
  crearConEstado(entity: T, context?: HttpContext): Observable<{ success: boolean; data?: T; error?: any }> {
    return this.safeOperationWithState<T>(
      this.post<T>(`${this.endpoint}/crear`, entity, undefined, undefined, context),
      `${this.endpoint}.crear`
    );
  }

  /**
   * Actualiza un elemento de forma segura, retornando null en caso de error
   */
  actualizarSafe(id: ID, entity: T, context?: HttpContext): Observable<T> {
    return this.safePutData<T>(
      `${this.endpoint}/${id}`,
      entity,
      {} as T, // ✅ Cast simple a T
      undefined,
      undefined,
      `${this.endpoint}.actualizar`,
      context
    );
  }

  /**
   * Elimina un elemento de forma segura, retornando false en caso de error
   */
  eliminarSafe(id: ID, context?: HttpContext): Observable<boolean> {
    return this.safeDeleteOperation(
      `${this.endpoint}/${id}`,
      undefined,
      undefined,
      `${this.endpoint}.eliminar`,
      context
    );
  }

  // ✅ MÉTODOS ORIGINALES (mantener exactamente como están)

  public listarPagina(
    pageNo?: number,
    pageSize?: number,
    sortField?: string,
    sortDirection?: string
  ): Observable<OpenpanelApiResponse<any>> {
    const params: any = {};
    if (pageNo != null) params[OPConstants.Pagination.PAGE_NO_PARAM] = String(pageNo);
    if (pageSize != null) params[this.pageSizeParam] = String(pageSize);
    if (sortField) {
      params[OPConstants.Pagination.SORT_PARAM] = `${sortField},${sortDirection || 'ASC'}`;
    }
    return this.get<any>(this.endpoint, params);
  }

  public listarPaginaSinGlobalLoader(
    pageNo: number,
    pageSize: number,
    sortField?: string,
    sortDirection?: string
  ): Observable<OpenpanelApiResponse<any>> {
    const params: any = {};
    if (pageNo != null) params[OPConstants.Pagination.PAGE_NO_PARAM] = String(pageNo);
    if (pageSize != null) params[this.pageSizeParam] = String(pageSize);
    if (sortField) {
      params[OPConstants.Pagination.SORT_PARAM] = `${sortField},${sortDirection || 'ASC'}`;
    }
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.get<any>(this.endpoint, params, undefined, context);
  }

  obtenerPorId(id: ID, context?: HttpContext): Observable<OpenpanelApiResponse<any>> {
    return this.get<any>(`${this.endpoint}/obtenerPorId/${id}`, undefined, undefined, context);
  }

  crear(entity: T, context?: HttpContext): Observable<any> {
    return this.post<any>(`${this.endpoint}/crear`, entity, undefined, undefined, context);
  }

  actualizar(id: ID, entity: T, context?: HttpContext): Observable<OpenpanelApiResponse<any>> {
    return this.put<any>(`${this.endpoint}/${id}`, entity, undefined, undefined, context);
  }

  borrar(id: ID, context?: HttpContext): Observable<OpenpanelApiResponse<any>> {
    return this.delete<any>(`${this.endpoint}/${id}`, undefined, undefined, context);
  }
}
