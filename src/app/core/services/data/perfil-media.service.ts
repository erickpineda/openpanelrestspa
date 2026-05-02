import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, map, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { OpenpanelApiResponse } from '../../models/openpanel-api-response.model';

export interface PerfilMediaDto {
  uuid?: string;
  nombre?: string;
  mimeType?: string;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class PerfilMediaService {
  private readonly base = `${environment.backend.host}${environment.backend.uri}`;
  private readonly avatarChangedSource = new Subject<void>();
  readonly avatarChanged$ = this.avatarChangedSource.asObservable();

  constructor(private http: HttpClient) {}

  getAvatarUrl(version?: number | string): string {
    const suffix = version !== undefined ? `?v=${encodeURIComponent(String(version))}` : '';
    return `${this.base}/usuarios/perfil/imagen${suffix}`;
  }

  getAvatarBlob(): Observable<Blob> {
    return this.http.get(`${this.base}/usuarios/perfil/imagen`, { responseType: 'blob' });
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
        tap(() => this.avatarChangedSource.next())
      );
  }

  deleteAvatar(): Observable<string | undefined> {
    return this.http
      .delete<OpenpanelApiResponse<string>>(`${this.base}/usuarios/perfil/imagen`)
      .pipe(
        map((response) => response?.data),
        tap(() => this.avatarChangedSource.next())
      );
  }
}
