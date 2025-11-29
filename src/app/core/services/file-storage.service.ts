import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FileStorageService {
  private base = `${environment.backend.host}${environment.backend.uri}`;

  constructor(private http: HttpClient) {}

  uploadFile(file: File, folder?: string): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    if (folder) form.append('folder', folder);
    return this.http.post(`${this.base}/fileStorage/subirFichero`, form);
  }

  listMedia(type: 'image' | 'file' = 'image', page?: number, size?: number): Observable<any> {
    let params = new HttpParams().set('type', type);
    if (page != null) params = params.set('page', String(page));
    if (size != null) params = params.set('size', String(size));
    return this.http.get(`${this.base}/media`, { params });
  }

  deleteMedia(id: string): Observable<any> {
    return this.http.delete(`${this.base}/media/${encodeURIComponent(id)}`);
  }
}
