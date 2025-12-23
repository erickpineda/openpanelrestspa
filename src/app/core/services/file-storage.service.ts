import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpHeaders,
  HttpContext,
} from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MediaItem } from '../models/media-item.model';
import { TokenStorageService } from './auth/token-storage.service';
import { NetworkInterceptor } from '../interceptor/network.interceptor';

@Injectable({ providedIn: 'root' })
export class FileStorageService {
  private base = `${environment.backend.host}${environment.backend.uri}`;

  constructor(
    private http: HttpClient,
    private tokenStorage?: TokenStorageService,
  ) {}

  uploadFile(file: File, folder?: string): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    if (folder) form.append('folder', folder);
    return this.http.post(`${this.base}/fileStorage/subirFichero`, form);
  }

  listMedia(
    type: 'image' | 'file' = 'image',
    page?: number,
    size?: number,
  ): Observable<any> {
    let params = new HttpParams().set('type', type);
    if (page != null) params = params.set('pageNo', String(page));
    if (size != null) params = params.set('pageSize', String(size));
    return this.http.get(`${this.base}/media`, { params });
  }

  listarFicheros(skipLoader: boolean = false): Observable<MediaItem[]> {
    const context = skipLoader
      ? new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true)
      : undefined;
    return this.http
      .get<any>(`${this.base}/fileStorage/ficheros`, { context })
      .pipe(
        map((resp) => {
          const data = resp?.data ?? resp;
          const arr = Array.isArray(data)
            ? data
            : Array.isArray(data?.content)
              ? data.content
              : [];
          return arr.map((f: any) => ({
            uuid: f?.uuidFileStorage,
            nombre: f?.nombre,
            tipo:
              f?.tipo && String(f.tipo).startsWith('image/') ? 'image' : 'file',
            mime: f?.tipo,
            url: f?.ruta,
            tamano: f?.size,
            fechaCreacion: f?.fechaCreacion,
          })) as MediaItem[];
        }),
      );
  }

  obtenerDatosFichero(
    uuid: string,
    skipLoader: boolean = false,
  ): Observable<any> {
    const context = skipLoader
      ? new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true)
      : undefined;
    return this.http
      .get<any>(
        `${this.base}/fileStorage/ficheros/obtenerDatos/${encodeURIComponent(uuid)}`,
        { context },
      )
      .pipe(map((resp) => resp?.data ?? resp));
  }

  descargarFichero(uuid: string, accept?: string): Observable<Blob> {
    let headers = new HttpHeaders({ Accept: '*/*' }); // ✅ Aceptar cualquier tipo de respuesta binaria
    const token = this.tokenStorage?.getToken && this.tokenStorage.getToken();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return this.http.get(
      `${this.base}/fileStorage/ficheros/descargar/${encodeURIComponent(uuid)}`,
      { responseType: 'blob', headers },
    );
  }

  deleteMedia(id: string): Observable<any> {
    return this.http.delete(`${this.base}/media/${encodeURIComponent(id)}`);
  }
}
