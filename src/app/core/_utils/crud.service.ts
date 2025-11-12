// core/_utils/crud.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { OpenpanelApiResponse } from '../models/openpanel-api-response.model';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export abstract class CrudService<T, ID> extends BaseService {
  protected abstract endpoint: string;

  constructor(
    protected override http: HttpClient,
    protected override tokenStorageService: TokenStorageService
  ) {
    super(http, tokenStorageService);
  }

  /**
   * Lista elementos de forma segura, retornando array vacío en caso de error
   */
  listarSafe(): Observable<T[]> {
    return this.safeGetList<T>(
      this.endpoint,
      undefined,
      undefined,
      `${this.endpoint}.listar`
    );
  }

  /**
   * Obtiene un elemento por ID de forma segura, retornando null en caso de error
   */
  obtenerPorIdSafe(id: ID): Observable<T> {
    return this.safeGetData<T>(
      `${this.endpoint}/obtenerPorId/${id}`,
      {} as T, // ✅ Cast simple a T
      undefined,
      undefined,
      `${this.endpoint}.obtenerPorId`
    );
  }

  /**
   * Crea un elemento de forma segura, retornando null en caso de error
   */
  crearSafe(entity: T): Observable<T> {
    return this.safePostData<T>(
      `${this.endpoint}/crear`,
      entity,
      {} as T, // ✅ Cast simple a T
      undefined,
      undefined,
      `${this.endpoint}.crear`
    );
  }

  /**
   * Crear elemento con estado
   */
  crearConEstado(entity: T): Observable<{ success: boolean; data?: T; error?: any }> {
    return this.safeOperationWithState<T>(
      this.post<T>(`${this.endpoint}/crear`, entity),
      `${this.endpoint}.crear`
    );
  }

  /**
   * Actualiza un elemento de forma segura, retornando null en caso de error
   */
  actualizarSafe(id: ID, entity: T): Observable<T> {
    return this.safePutData<T>(
      `${this.endpoint}/${id}`,
      entity,
      {} as T, // ✅ Cast simple a T
      undefined,
      undefined,
      `${this.endpoint}.actualizar`
    );
  }

  /**
   * Elimina un elemento de forma segura, retornando false en caso de error
   */
  eliminarSafe(id: ID): Observable<boolean> {
    return this.safeDeleteOperation(
      `${this.endpoint}/${id}`,
      undefined,
      undefined,
      `${this.endpoint}.eliminar`
    );
  }

  // ✅ MÉTODOS ORIGINALES (mantener exactamente como están)

  listar(): Observable<OpenpanelApiResponse<any>> {
    return this.get<any>(this.endpoint);
  }

  public listarPagina(
    pageNo: number,
    pageSize: number
  ): Observable<OpenpanelApiResponse<any>> {
    const params = { pageNo: pageNo.toString(), pageSize: pageSize.toString() };
    return this.get<any>(this.endpoint, { params });
  }

  obtenerPorId(id: ID): Observable<OpenpanelApiResponse<any>> {
    return this.get<any>(`${this.endpoint}/obtenerPorId/${id}`);
  }

  crear(entity: T): Observable<any> {
    return this.post<any>(`${this.endpoint}/crear`, entity);
  }

  actualizar(id: ID, entity: T): Observable<OpenpanelApiResponse<any>> {
    return this.put<any>(`${this.endpoint}/${id}`, entity);
  }

  borrar(id: ID): Observable<OpenpanelApiResponse<any>> {
    return this.delete<any>(`${this.endpoint}/${id}`);
  }
}
