import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  uploadAvatar(file: File): Observable<PerfilMediaDto> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<OpenpanelApiResponse<PerfilMediaDto>>(`${this.base}/usuarios/perfil/imagen`, formData)
      .pipe(map((response) => response?.data ?? {}));
  }

  deleteAvatar(): Observable<string | undefined> {
    return this.http
      .delete<OpenpanelApiResponse<string>>(`${this.base}/usuarios/perfil/imagen`)
      .pipe(map((response) => response?.data));
  }
}
