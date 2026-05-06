// src/app/core/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { AuthSyncService } from '../services/auth/auth-sync.service';
import { SessionManagerService } from '../services/auth/session-manager.service';
import { isJwtExpired } from '../_utils/jwt.utils';

const TOKEN_HEADER_KEY = 'Authorization';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private tokenStorage: TokenStorageService,
    private authSync: AuthSyncService,
    private sessionManager: SessionManagerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.tokenStorage.getToken();

    const url = req.url || '';
    const isAuthEndpoint =
      url.includes('/login') || url.includes('/auth') || url.includes('/refresh');
    const isAsset = url.includes('/assets/') || url.includes('.json');

    // Skip authentication logic for assets
    if (isAsset) {
      return next.handle(req);
    }

    // Si hay token pero está caducado: Notificar sesión expirada (esto abre el modal)
    if (token && isJwtExpired(token, 0)) {
      // Importante: No redirigimos directamente a /login, sino que mostramos el modal
      // para que el usuario sepa qué pasó y pueda intentar guardar (si aplica).
      this.sessionManager.notifySessionExpired();
      return EMPTY;
    }

    let authReq = req;
    if (token && !isAuthEndpoint) {
      authReq = req.clone({
        headers: req.headers.set(TOKEN_HEADER_KEY, `Bearer ${token}`),
      });
    }

    return next.handle(authReq).pipe(
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse) {
          // Si un endpoint protegido devuelve 401 o 403:
          // - Verificar si es sesión expirada O sesión huérfana (token válido pero sesión no existe)
          if ((err.status === 401 || err.status === 403) && !isAuthEndpoint) {
            const currentToken = this.tokenStorage.getToken();
            const shouldExpireSession = !currentToken || isJwtExpired(currentToken, 0);
            
            if (!shouldExpireSession) {
              // Token válido pero 401/403 = sesión huérfana (eliminada en backend)
              this.sessionManager.notifySessionOrphaned();
              return EMPTY;
            }
            
            // Token expirado o no existe = sesión expirada normal
            this.sessionManager.notifySessionExpired();
            return EMPTY;
          }
        }
        return throwError(() => err);
      })
    );
  }
}
