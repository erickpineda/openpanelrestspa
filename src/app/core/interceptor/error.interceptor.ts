// core/interceptor/error.interceptor.ts - VERSIÓN CORREGIDA
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GlobalErrorHandlerService } from '../errors/global-error/global-error-handler.service';
import { LoggerService } from '../services/logger.service';
import { SKIP_GLOBAL_ERROR_HANDLING } from './skip-global-error.token';
export { SKIP_GLOBAL_ERROR_HANDLING };

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private errorHandler: GlobalErrorHandlerService,
    private log: LoggerService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: unknown) => {
        // Convertir a HttpErrorResponse si es necesario
        const httpError = this.ensureHttpErrorResponse(error);

        // No manejar errores de logging para evitar loops
        if (request.url.includes('/error')) {
          return throwError(() => httpError);
        }

        this.log.info('🔍 [INTERCEPTOR] Error capturado:', httpError);

        // Verificar si se debe saltar el manejo global
        if (request.context.get(SKIP_GLOBAL_ERROR_HANDLING)) {
          this.log.info('⏩ [INTERCEPTOR] Saltando manejo global de error por contexto');
        } else {
          // El GlobalErrorHandlerService se encargará de mostrar la notificación
          this.errorHandler.handleError(httpError);
        }

        // Propagar el error para que los componentes puedan manejarlo también
        return throwError(() => httpError);
      })
    );
  }

  private ensureHttpErrorResponse(error: unknown): HttpErrorResponse {
    if (error instanceof HttpErrorResponse) {
      return error;
    }

    // Si no es HttpErrorResponse, crear uno
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new HttpErrorResponse({
      error: error,
      status: 0, // Unknown status
      statusText: 'Client Error',
      url: undefined,
    });
  }
}
