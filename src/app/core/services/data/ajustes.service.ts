import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { CrudService } from '../../_utils/crud.service';
import { SystemSetting } from '../../models/system-setting.model';
import { HttpClient } from '@angular/common/http';
import { TokenStorageService } from '../auth/token-storage.service';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { PaginaResponse } from '../../models/pagina-response.model';
import { SearchQuery } from '../../../shared/models/search.models';

@Injectable({ providedIn: 'root' })
export class AjustesService extends CrudService<SystemSetting, string> {
  protected override endpoint = '/config/ajustes';

  constructor(
    protected override http: HttpClient,
    protected override tokenStorageService: TokenStorageService
  ) {
    super(http, tokenStorageService);
  }

  private encodeSegment(value: string): string {
    return encodeURIComponent(value);
  }

  override obtenerPorId(clave: string, context?: HttpContext): Observable<any> {
    return this.get<any>(
      `${this.endpoint}/clave/${this.encodeSegment(clave)}`,
      undefined,
      undefined,
      context
    );
  }

  override obtenerPorIdSafe(clave: string, context?: HttpContext): Observable<SystemSetting> {
    return this.safeGetData<SystemSetting>(
      `${this.endpoint}/clave/${this.encodeSegment(clave)}`,
      {} as SystemSetting,
      undefined,
      undefined,
      `${this.endpoint}.obtenerPorClave`,
      context
    );
  }

  override actualizar(clave: string, entity: SystemSetting, context?: HttpContext): Observable<any> {
    return this.put<any>(
      `${this.endpoint}/clave/${this.encodeSegment(clave)}`,
      entity,
      undefined,
      undefined,
      context
    );
  }

  override actualizarSafe(
    clave: string,
    entity: SystemSetting,
    context?: HttpContext
  ): Observable<SystemSetting> {
    return this.safePutData<SystemSetting>(
      `${this.endpoint}/clave/${this.encodeSegment(clave)}`,
      entity,
      {} as SystemSetting,
      undefined,
      undefined,
      `${this.endpoint}.actualizarPorClave`,
      context
    );
  }

  override borrar(clave: string, context?: HttpContext): Observable<any> {
    return this.delete<any>(
      `${this.endpoint}/clave/${this.encodeSegment(clave)}`,
      undefined,
      undefined,
      context
    );
  }

  override eliminarSafe(clave: string, context?: HttpContext): Observable<boolean> {
    return this.safeDeleteOperation(
      `${this.endpoint}/clave/${this.encodeSegment(clave)}`,
      undefined,
      undefined,
      `${this.endpoint}.eliminarPorClave`,
      context
    );
  }

  listarAjustesSafe(): Observable<SystemSetting[]> {
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    const params: Record<string, string> = {
      [OPConstants.Pagination.PAGE_NO_PARAM]: '0',
      [this.pageSizeParam]: '500',
      [OPConstants.Pagination.SORT_PARAM]: 'categoria,ASC',
    };

    return this.safeGetData<PaginaResponse>(
      this.endpoint,
      new PaginaResponse(),
      params,
      undefined,
      'config.ajustes.listar',
      context
    ).pipe(
      map((data) => {
        const raw = (data?.elements ?? (data as any)?.items ?? (data as any)?.content ?? []) as SystemSetting[];
        return Array.isArray(raw) ? raw : [];
      })
    );
  }

  buscarPaginaAjustesSafe(
    searchRequest: SearchQuery,
    pageNo: number = 0,
    pageSize: number = 20,
    sortField?: string,
    sortDirection?: 'ASC' | 'DESC',
    context?: HttpContext
  ): Observable<PaginaResponse> {
    const finalContext = context ?? new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    const params: Record<string, string> = {
      pageNo: String(pageNo),
      pageSize: String(pageSize),
      sortBy: sortField || '',
      sortDir: sortDirection || '',
    };

    return this.safePostData<PaginaResponse>(
      `${this.endpoint}/buscar`,
      searchRequest,
      new PaginaResponse(),
      params,
      undefined,
      `${this.endpoint}.buscar`,
      finalContext
    );
  }

  obtenerPorClaveSafe(clave: string, context?: HttpContext): Observable<SystemSetting> {
    return this.obtenerPorIdSafe(clave, context);
  }

  actualizarPorClaveSafe(
    clave: string,
    entity: SystemSetting,
    context?: HttpContext
  ): Observable<SystemSetting> {
    return this.actualizarSafe(clave, entity, context);
  }

  eliminarPorClaveSafe(clave: string, context?: HttpContext): Observable<boolean> {
    return this.eliminarSafe(clave, context);
  }

  buscar(
    searchRequest: unknown,
    pageNo: number = 0,
    pageSize: number = 50,
    sortField?: string,
    sortDirection?: string,
    context?: HttpContext
  ): Observable<any> {
    const params: Record<string, string> = {
      [OPConstants.Pagination.PAGE_NO_PARAM]: pageNo.toString(),
      [this.pageSizeParam]: pageSize.toString(),
    };

    if (sortField) {
      params[OPConstants.Pagination.SORT_PARAM] = `${sortField},${sortDirection || 'ASC'}`;
    }

    return this.post<any>(`${this.endpoint}/buscar`, searchRequest, params, undefined, context);
  }

  listarPorCategoriaSafe(categoria: string, context?: HttpContext): Observable<SystemSetting[]> {
    return this.safeGetList<SystemSetting>(
      `${this.endpoint}/categoria/${this.encodeSegment(categoria)}`,
      undefined,
      undefined,
      `${this.endpoint}.listarPorCategoria`,
      context
    );
  }

  resolverSafe(
    claves: string[],
    context?: HttpContext
  ): Observable<Record<string, unknown>> {
    return this.safePostData<Record<string, unknown>>(
      `${this.endpoint}/resolver`,
      claves,
      {},
      undefined,
      undefined,
      `${this.endpoint}.resolver`,
      context
    );
  }
}
