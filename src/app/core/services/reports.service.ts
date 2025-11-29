import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private base = `${environment.backend.host}${environment.backend.uri}`;

  constructor(private http: HttpClient) {}

  getReports(page?: number, size?: number): Observable<any> {
    let params = new HttpParams();
    if (page != null) params = params.set('page', String(page));
    if (size != null) params = params.set('size', String(size));
    return this.http.get(`${this.base}/reports`, { params });
  }

  export(type: string, from?: string, to?: string): Observable<Blob> {
    let params = new HttpParams().set('type', type);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' as 'json' });
  }

  import(file: File, type?: string): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    if (type) form.append('type', type);
    return this.http.post(`${this.base}/import`, form);
  }
}
