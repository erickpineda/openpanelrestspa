import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, Subject, map, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { OpenpanelApiResponse } from '../../models/openpanel-api-response.model';
import { SKIP_GLOBAL_ERROR_HANDLING } from '../../interceptor/skip-global-error.token';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';

export interface PerfilMediaDto {
  uuid?: string;
  nombre?: string;
  mimeType?: string;
  size?: number;
}

export type AvatarChangeEvent = 'uploaded' | 'deleted';

@Injectable({ providedIn: 'root' })
export class PerfilMediaService {
  private readonly base = `${environment.backend.host}${environment.backend.uri}`;
  private readonly avatarChangedSource = new Subject<AvatarChangeEvent>();
  readonly avatarChanged$ = this.avatarChangedSource.asObservable();

  constructor(private http: HttpClient) {}

  getAvatarUrl(version?: number | string): string {
    const suffix = version !== undefined ? `?v=${encodeURIComponent(String(version))}` : '';
    return `${this.base}/usuarios/perfil/imagen${suffix}`;
  }

  getAvatarBlob(): Observable<Blob> {
    const context = new HttpContext()
      .set(SKIP_GLOBAL_ERROR_HANDLING, true)
      .set(SKIP_GLOBAL_LOADER, true);
    return this.http.get(`${this.base}/usuarios/perfil/imagen`, { responseType: 'blob', context });
  }

  getAvatarObjectUrl(): Observable<string> {
    return this.getAvatarBlob().pipe(map((blob) => URL.createObjectURL(blob)));
  }

  uploadAvatar(file: File): Observable<PerfilMediaDto> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<OpenpanelApiResponse<PerfilMediaDto>>(`${this.base}/usuarios/perfil/imagen`, formData)
      .pipe(
        map((response) => response?.data ?? {}),
        tap(() => this.avatarChangedSource.next('uploaded'))
      );
  }

  deleteAvatar(): Observable<string | undefined> {
    return this.http
      .delete<OpenpanelApiResponse<string>>(`${this.base}/usuarios/perfil/imagen`)
      .pipe(
        map((response) => response?.data),
        tap(() => this.avatarChangedSource.next('deleted'))
      );
  }
}
