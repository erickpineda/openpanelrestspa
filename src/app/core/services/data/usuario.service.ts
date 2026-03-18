import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Usuario } from '../../models/usuario.model';
import { CrudService } from '../../_utils/crud.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { catchError, Observable, map, firstValueFrom, of } from 'rxjs';
import { PerfilResponse } from '../../models/perfil-response.model';
import { OpenpanelApiResponse } from '../../models/openpanel-api-response.model';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';
import { PaginaResponse } from '../../models/pagina-response.model';
import { OPConstants } from '../../../shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService extends CrudService<Usuario, number> {
  protected override endpoint = '/usuarios';
  protected override pageSizeParam = OPConstants.Pagination.PAGE_SIZE_PARAM;

  constructor(
    protected override http: HttpClient,
    protected override tokenStorageService: TokenStorageService
  ) {
    super(http, tokenStorageService);
  }

  // ✅ Métodos migrados de UsuariosService

  buscarSafe(
    searchRequest: any,
    pageNo: number,
    pageSize: number,
    sortField?: string,
    sortDirection?: string
  ): Observable<PaginaResponse> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = pageNo.toString();
    params[this.pageSizeParam] = pageSize.toString();
    if (sortField) {
      params[OPConstants.Pagination.SORT_PARAM] = `${sortField},${sortDirection || 'ASC'}`;
    }
    const context = new HttpContext();
    return this.safePostData<PaginaResponse>(
      `${this.endpoint}/buscar`,
      searchRequest,
      new PaginaResponse(),
      params,
      undefined,
      'usuarios.buscar',
      context
    );
  }

  buscarSinGlobalLoader(
    searchRequest: any,
    pageNo: number,
    pageSize: number,
    sortField?: string,
    sortDirection?: string
  ): Observable<any> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = pageNo.toString();
    params[this.pageSizeParam] = pageSize.toString();
    if (sortField) {
      params[OPConstants.Pagination.SORT_PARAM] = `${sortField},${sortDirection || 'ASC'}`;
    }
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.post<any>(`${this.endpoint}/buscar`, searchRequest, params, undefined, context);
  }

  // ✅ SOLO los métodos esenciales seguros

  /**
   * Método seguro principal para obtener datos de sesión
   */
  obtenerDatosSesionActualSafe(context?: HttpContext): Observable<PerfilResponse> {
    return this.safeGetData<PerfilResponse>(
      `${this.endpoint}/perfil/yo`,
      {} as PerfilResponse,
      undefined,
      undefined,
      'usuarios.obtenerDatosSesionActual',
      context
    );
  }

  /**
   * Método seguro para obtener usuario por username
   */
  obtenerPorUsernameSafe(username: string): Observable<Usuario> {
    return this.safeGetData<Usuario>(
      `${this.endpoint}/obtenerPorUsername/${username}`,
      {} as Usuario,
      undefined,
      undefined,
      'usuarios.obtenerPorUsername'
    );
  }

  /**
   * Método mejorado para obtener username
   */
  async getUsernameActual(): Promise<string> {
    try {
      const perfil = await firstValueFrom(this.obtenerDatosSesionActualSafe());
      return perfil?.username || 'Usuario no disponible';
    } catch (err) {
      return 'Usuario no disponible';
    }
  }

  // ✅ Mantener método original por compatibilidad
  obtenerDatosSesionActual(): Observable<OpenpanelApiResponse<PerfilResponse>> {
    return this.get<PerfilResponse>(`${this.endpoint}/perfil/yo`);
  }

  actualizarParcial(
    username: string,
    modificado: Usuario,
    context?: HttpContext
  ): Observable<OpenpanelApiResponse<any>> {
    // Content-Type application/json-patch+json is required for JSON Patch (even if body is Usuario model as per backend requirement)
    const headers = this.setHeaders({
      'Content-Type': 'application/json-patch+json',
    });
    return this.patch<any>(
      `${this.endpoint}/perfil/${username}`,
      modificado,
      undefined,
      headers,
      context
    );
  }

  checkUsernameAvailability(
    username: string,
    context?: HttpContext
  ): Observable<OpenpanelApiResponse<any>> {
    const body = { username };
    const finalContext = context || new HttpContext();
    if (!finalContext.has(SKIP_GLOBAL_LOADER)) {
      finalContext.set(SKIP_GLOBAL_LOADER, true);
    }
    return this.post<any>(
      `${this.endpoint}/checkUsernameAvailability`,
      body,
      undefined,
      undefined,
      finalContext
    );
  }

  changePassword(
    changePasswordDTO: any,
    context?: HttpContext
  ): Observable<OpenpanelApiResponse<any>> {
    const finalContext = context || new HttpContext();
    if (!finalContext.has(SKIP_GLOBAL_LOADER)) {
      finalContext.set(SKIP_GLOBAL_LOADER, true);
    }
    return this.post<any>(
      `${this.endpoint}/changePassword`,
      changePasswordDTO,
      undefined,
      undefined,
      finalContext
    );
  }

  // ✅ Implementación mínima requerida
  protected createDefaultEntity(): Usuario {
    return {} as Usuario;
  }
}
