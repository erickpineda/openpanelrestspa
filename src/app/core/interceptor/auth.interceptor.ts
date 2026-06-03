import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { SessionManagerService } from '../services/auth/session-manager.service';
import { isJwtExpired } from '../_utils/jwt.utils';

const TOKEN_HEADER_KEY = 'Authorization';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const tokenStorage = inject(TokenStorageService);
  const sessionManager = inject(SessionManagerService);

  const token = tokenStorage.getToken();
  const url = req.url || '';
  const isAuthEndpoint = url.includes('/login') || url.includes('/auth') || url.includes('/refresh');
  const isAsset = url.includes('/assets/') || url.includes('.json');

  if (isAsset) {
    return next(req);
  }

  if (token && isJwtExpired(token, 0)) {
    sessionManager.notifySessionExpired();
    return EMPTY;
  }

  let authReq = req;
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      headers: req.headers.set(TOKEN_HEADER_KEY, `Bearer ${token}`),
    });
  }

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 && !isAuthEndpoint) {
          const currentToken = tokenStorage.getToken();
          if (!currentToken || isJwtExpired(currentToken, 0)) {
            sessionManager.notifySessionExpired();
          } else {
            sessionManager.notifySessionOrphaned();
          }
          return EMPTY;
        }
      }
      return throwError(() => err);
    })
  );
};
