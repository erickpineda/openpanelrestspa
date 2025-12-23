import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { CrudService } from '../../_utils/crud.service';
import { MediaItem, MediaBuscarResponse } from '../../models/media-item.model';
import { HttpClient } from '@angular/common/http';
import { TokenStorageService } from '../auth/token-storage.service';

@Injectable({ providedIn: 'root' })
export class ImagenesService extends CrudService<MediaItem, number> {
  protected endpoint = '/media';

  constructor(
    protected override http: HttpClient,
    protected override tokenStorageService: TokenStorageService,
  ) {
    super(http, tokenStorageService);
  }

  override listarSafe(
    pageNo?: number,
    pageSize?: number,
  ): Observable<MediaItem[]> {
    const params: any = { type: 'image' };
    if (pageNo != null) params.pageNo = String(pageNo);
    if (pageSize != null) params.pageSize = String(pageSize);
    const context = new HttpContext();
    return this.safeGetList<MediaItem>(
      this.endpoint,
      params,
      undefined,
      'media.imagenes.listar',
      context,
    );
  }

  buscarSafe(
    payload: any,
    pageNo?: number,
    pageSize?: number,
  ): Observable<MediaBuscarResponse> {
    const params: any = { type: 'image' };
    if (pageNo != null) params.pageNo = String(pageNo);
    if (pageSize != null) params.pageSize = String(pageSize);
    const context = new HttpContext();
    return this.safePostData<MediaBuscarResponse>(
      `${this.endpoint}/buscar`,
      payload,
      { elements: [], totalPages: 0 },
      params,
      undefined,
      'media.imagenes.buscar',
      context,
    );
  }
}
