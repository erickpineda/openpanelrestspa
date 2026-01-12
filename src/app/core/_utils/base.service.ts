// core/_utils/base.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpContext } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { OpenpanelApiResponse, PaginatedResponse } from '../models/openpanel-api-response.model';
import { TokenStorageService } from '../services/auth/token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  protected host = environment.backend.host;
  protected uri = environment.backend.uri;

  constructor(
    protected http: HttpClient,
    protected tokenStorageService?: TokenStorageService
  ) {}

  // ✅ MÉTODO SETHEADERS INTEGRADO
  protected setHeaders(additionalHeaders?: { [header: string]: string | string[] }): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    // ✅ Agregar Authorization si existe token
    if (this.tokenStorageService?.getToken()) {
      headers = headers.append('Authorization', `Bearer ${this.tokenStorageService.getToken()}`);
    }

    // ✅ Agregar headers adicionales si se proporcionan
    if (additionalHeaders) {
      Object.keys(additionalHeaders).forEach((key) => {
        const value = additionalHeaders[key];
        if (Array.isArray(value)) {
          value.forEach((v) => (headers = headers.append(key, v)));
        } else {
          headers = headers.set(key, value);
        }
      });
    }

    return headers;
  }

  // ✅ MÉTODOS ORIGINALES ACTUALIZADOS PARA USAR SETHEADERS POR DEFECTO
  protected get<T>(
    url: string,
    params?: any,
    headers?: HttpHeaders,
    context?: HttpContext
  ): Observable<OpenpanelApiResponse<T>> {
    const finalHeaders = headers || this.setHeaders();
    const options = {
      params: this.getParams(params),
      headers: finalHeaders,
      context,
    };
    return this.http.get<OpenpanelApiResponse<T>>(`${this.host}${this.uri}${url}`, options);
  }

  protected post<T>(
    url: string,
    body: any,
    params?: any,
    headers?: HttpHeaders,
    context?: HttpContext
  ): Observable<OpenpanelApiResponse<T>> {
    const finalHeaders = headers || this.setHeaders();
    const options = {
      params: this.getParams(params),
      headers: finalHeaders,
      context,
    };
    return this.http.post<OpenpanelApiResponse<T>>(`${this.host}${this.uri}${url}`, body, options);
  }

  protected put<T>(
    url: string,
    body: any,
    params?: any,
    headers?: HttpHeaders,
    context?: HttpContext
  ): Observable<OpenpanelApiResponse<T>> {
    const finalHeaders = headers || this.setHeaders();
    const options = {
      params: this.getParams(params),
      headers: finalHeaders,
      context,
    };
    return this.http.put<OpenpanelApiResponse<T>>(`${this.host}${this.uri}${url}`, body, options);
  }

  protected delete<T>(
    url: string,
    params?: any,
    headers?: HttpHeaders,
    context?: HttpContext
  ): Observable<OpenpanelApiResponse<T>> {
    const finalHeaders = headers || this.setHeaders();
    const options = {
      params: this.getParams(params),
      headers: finalHeaders,
      context,
    };
    return this.http.delete<OpenpanelApiResponse<T>>(`${this.host}${this.uri}${url}`, options);
  }

  protected patch<T>(
    url: string,
    body: any,
    params?: any,
    headers?: HttpHeaders,
    context?: HttpContext
  ): Observable<OpenpanelApiResponse<T>> {
    const finalHeaders = headers || this.setHeaders();
    const options = {
      params: this.getParams(params),
      headers: finalHeaders,
      context,
    };
    return this.http.patch<OpenpanelApiResponse<T>>(`${this.host}${this.uri}${url}`, body, options);
  }

  /**
   * Método seguro con estado para operaciones críticas
   */
  protected safeOperationWithState<T>(
    observable: Observable<OpenpanelApiResponse<T>>,
    context: string = 'unknown'
  ): Observable<{ success: boolean; data?: T; error?: any }> {
    return observable.pipe(
      map((response) => ({
        success: response.result?.success === true,
        data: response.data,
      })),
      catchError((error) => {
        this.logSafeError(context, error);
        return of({
          success: false,
          error,
        });
      })
    );
  }

  private getParams(params: any): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.append(key, params[key]);
        }
      });
    }
    return httpParams;
  }

  // ✅ MÉTODOS SEGUROS ACTUALIZADOS PARA USAR SETHEADERS POR DEFECTO
  protected safeGetData<T>(
    url: string,
    defaultValue: T,
    params?: any,
    headers?: HttpHeaders,
    context?: string,
    contextHttp?: HttpContext
  ): Observable<T> {
    const finalHeaders = headers || this.setHeaders();
    return this.get<T>(url, params, finalHeaders, contextHttp).pipe(
      map((response) => response.data ?? defaultValue),
      catchError((error) => {
        this.logSafeError(context || `GET ${url}`, error);
        return of(defaultValue);
      })
    );
  }

  protected safeGetList<T>(
    url: string,
    params?: any,
    headers?: HttpHeaders,
    context?: string,
    contextHttp?: HttpContext
  ): Observable<T[]> {
    const finalHeaders = headers || this.setHeaders();
    return this.get<PaginatedResponse<T>>(url, params, finalHeaders, contextHttp).pipe(
      map((response) => response.data?.elements ?? []),
      catchError((error) => {
        this.logSafeError(context || `GET ${url}`, error);
        return of([]);
      })
    );
  }

  protected safePostData<T>(
    url: string,
    body: any,
    defaultValue: T,
    params?: any,
    headers?: HttpHeaders,
    context?: string,
    contextHttp?: HttpContext
  ): Observable<T> {
    const finalHeaders = headers || this.setHeaders();
    return this.post<T>(url, body, params, finalHeaders, contextHttp).pipe(
      map((response) => response.data ?? defaultValue),
      catchError((error) => {
        this.logSafeError(context || `POST ${url}`, error);
        return of(defaultValue);
      })
    );
  }

  protected safePostOperation(
    url: string,
    body: any,
    params?: any,
    headers?: HttpHeaders,
    context?: string,
    contextHttp?: HttpContext
  ): Observable<boolean> {
    const finalHeaders = headers || this.setHeaders();
    return this.post<any>(url, body, params, finalHeaders, contextHttp).pipe(
      map((response) => response.result?.success === true),
      catchError((error) => {
        this.logSafeError(context || `POST ${url}`, error);
        return of(false);
      })
    );
  }

  protected safePutData<T>(
    url: string,
    body: any,
    defaultValue: T,
    params?: any,
    headers?: HttpHeaders,
    context?: string,
    contextHttp?: HttpContext
  ): Observable<T> {
    const finalHeaders = headers || this.setHeaders();
    return this.put<T>(url, body, params, finalHeaders, contextHttp).pipe(
      map((response) => response.data ?? defaultValue),
      catchError((error) => {
        this.logSafeError(context || `PUT ${url}`, error);
        return of(defaultValue);
      })
    );
  }

  protected safeDeleteOperation(
    url: string,
    params?: any,
    headers?: HttpHeaders,
    context?: string,
    contextHttp?: HttpContext
  ): Observable<boolean> {
    const finalHeaders = headers || this.setHeaders();
    return this.delete<any>(url, params, finalHeaders, contextHttp).pipe(
      map((response) => response.result?.success === true),
      catchError((error) => {
        this.logSafeError(context || `DELETE ${url}`, error);
        return of(false);
      })
    );
  }

  /**
   * Log de errores solo en desarrollo
   */
  private logSafeError(context: string, error: any): void {
    if (!environment.production) {
      console.debug(`🔕 [${context}] Error silenciado - ya manejado globalmente`);
    }
  }
}
