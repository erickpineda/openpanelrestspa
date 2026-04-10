import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { CrudService } from '../../_utils/crud.service';
import { Tema, TemaDraftRequest, TemaPreviewTokenResponse } from '../../models/tema.model';
import { HttpClient } from '@angular/common/http';
import { TokenStorageService } from '../auth/token-storage.service';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';
import { PaginaResponse } from '../../models/pagina-response.model';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { OpenpanelApiResponse } from '../../models/openpanel-api-response.model';
import { map } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TemasService extends CrudService<Tema, number> {
  protected endpoint = '/config/temas';

  constructor(
    protected override http: HttpClient,
    protected override tokenStorageService: TokenStorageService
  ) {
    super(http, tokenStorageService);
  }

  /**
   * Listado paginado (server paging) usando los params del backend:
   * pageNo, pageSize, sortBy, sortDir
   */
  listarPaginaSinGlobalLoader(
    pageNo: number,
    pageSize: number,
    sortBy?: string,
    sortDir?: 'ASC' | 'DESC'
  ): Observable<PaginaResponse> {
    const params: any = {};
    params[OPConstants.Pagination.PAGE_NO_PARAM] = String(pageNo ?? 0);
    params[OPConstants.Pagination.PAGE_SIZE_PARAM] = String(pageSize ?? OPConstants.Pagination.DEFAULT_PAGE_SIZE);
    if (sortBy) params['sortBy'] = sortBy;
    if (sortDir) params['sortDir'] = sortDir;

    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.safeGetData<PaginaResponse>(
      this.endpoint,
      new PaginaResponse(),
      params,
      undefined,
      'temas.listar',
      context
    );
  }

  obtenerPorSlug(slug: string, context?: HttpContext): Observable<Tema> {
    return this.safeGetData<Tema>(
      `${this.endpoint}/${encodeURIComponent(slug)}`,
      {} as Tema,
      undefined,
      undefined,
      'temas.obtenerPorSlug',
      context
    );
  }

  crearTema(dto: Partial<Tema>, context?: HttpContext): Observable<Tema> {
    return this.safePostData<Tema>(
      this.endpoint,
      dto,
      {} as Tema,
      undefined,
      undefined,
      'temas.crear',
      context
    );
  }

  actualizarPorSlug(slug: string, dto: Partial<Tema>, context?: HttpContext): Observable<Tema> {
    return this.safePutData<Tema>(
      `${this.endpoint}/${encodeURIComponent(slug)}`,
      dto,
      {} as Tema,
      undefined,
      undefined,
      'temas.actualizar',
      context
    );
  }

  borrarPorSlug(slug: string, context?: HttpContext): Observable<boolean> {
    return this.safeDeleteOperation(
      `${this.endpoint}/${encodeURIComponent(slug)}`,
      undefined,
      undefined,
      'temas.borrar',
      context
    );
  }

  upsertDraft(slug: string, draft: TemaDraftRequest, context?: HttpContext): Observable<Tema> {
    return this.safePutData<Tema>(
      `${this.endpoint}/${encodeURIComponent(slug)}/draft`,
      draft,
      {} as Tema,
      undefined,
      undefined,
      'temas.draft.upsert',
      context
    );
  }

  uploadDraftPackage(slug: string, file: File, context?: HttpContext): Observable<Tema> {
    const form = new FormData();
    form.append('file', file);

    // No forzar Content-Type; que el browser ponga boundary.
    let headers = new HttpHeaders();
    const token = this.tokenStorageService?.getToken && this.tokenStorageService.getToken();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);

    const ctx = context ?? new HttpContext().set(SKIP_GLOBAL_LOADER, true);

    return this.http
      .post<OpenpanelApiResponse<Tema>>(
        `${this.host}${this.uri}${this.endpoint}/${encodeURIComponent(slug)}/draft/upload`,
        form,
        { headers, context: ctx }
      )
      .pipe(map((resp) => resp?.data ?? ({} as Tema)));
  }

  createPreviewToken(slug: string, context?: HttpContext): Observable<TemaPreviewTokenResponse> {
    return this.safePostData<TemaPreviewTokenResponse>(
      `${this.endpoint}/${encodeURIComponent(slug)}/preview-token`,
      {},
      {} as TemaPreviewTokenResponse,
      undefined,
      undefined,
      'temas.previewToken',
      context
    );
  }

  publish(slug: string, context?: HttpContext): Observable<Tema> {
    return this.safePostData<Tema>(
      `${this.endpoint}/${encodeURIComponent(slug)}/publish`,
      {},
      {} as Tema,
      undefined,
      undefined,
      'temas.publish',
      context
    );
  }

  activate(slug: string, version?: number, context?: HttpContext): Observable<Tema> {
    const params: any = {};
    if (version != null) params['version'] = String(version);
    return this.safePostData<Tema>(
      `${this.endpoint}/${encodeURIComponent(slug)}/activate`,
      {},
      {} as Tema,
      params,
      undefined,
      'temas.activate',
      context
    );
  }
}
