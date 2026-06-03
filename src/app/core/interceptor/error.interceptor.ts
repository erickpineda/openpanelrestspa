import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GlobalErrorHandlerService } from '../errors/global-error/global-error-handler.service';
import { LoggerService } from '../services/logger.service';
import { SKIP_GLOBAL_ERROR_HANDLING } from './skip-global-error.token';

export { SKIP_GLOBAL_ERROR_HANDLING };

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const errorHandler = inject(GlobalErrorHandlerService);
  const log = inject(LoggerService);

  return next(req).pipe(
    catchError((error: unknown) => {
      let httpError: HttpErrorResponse;
      if (error instanceof HttpErrorResponse) {
        httpError = error;
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        httpError = new HttpErrorResponse({
          error: error,
          status: 0,
          statusText: 'Client Error',
          url: req.url,
        });
      }

      if (req.url.includes('/error')) {
        return throwError(() => httpError);
      }

      log.info('🔍 [INTERCEPTOR] Error capturado:', httpError);

      if (req.context.get(SKIP_GLOBAL_ERROR_HANDLING)) {
        log.info('⏩ [INTERCEPTOR] Saltando manejo global de error por contexto');
      } else {
        errorHandler.handleError(httpError);
      }

      return throwError(() => httpError);
    })
  );
};
