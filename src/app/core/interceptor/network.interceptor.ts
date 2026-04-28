import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
  HttpContextToken,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { LoadingService } from '../services/ui/loading.service';
import { ToastService } from '../services/ui/toast.service';
import { LoggerService } from '../services/logger.service';
import { Router } from '@angular/router';
import { SessionManagerService } from '../services/auth/session-manager.service';

// Token para saltar el loading global
export const SKIP_GLOBAL_LOADER = new HttpContextToken<boolean>(() => false);
// Token para saltar las notificaciones globales del interceptor
export const SKIP_GLOBAL_NOTIFY = new HttpContextToken<boolean>(() => false);

@Injectable()
export class NetworkInterceptor implements HttpInterceptor {
  // Lista de URLs que no deben mostrar loading global
  private readonly skippedUrls = ['/assets/', '/i18n/', '/health'];

  constructor(
    private loadingService: LoadingService,
    private toastService: ToastService,
    private log: LoggerService,
    private router: Router,
    private sessionManager: SessionManagerService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Verificar si debemos saltar el loading
    const shouldSkipLoading =
      request.context.get(SKIP_GLOBAL_LOADER) ||
      this.skippedUrls.some((url) => request.url.includes(url));

    if (!shouldSkipLoading) {
      this.loadingService.setGlobalLoading(true, request.url);
    }

    const started = Date.now();

    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          const elapsed = Date.now() - started;
          // Log de peticiones lentas (> 1s)
          if (elapsed > 1000) {
            this.log.warn(`🐢 Petición lenta: ${request.method} ${request.url} (${elapsed}ms)`);
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const skipNotify = request.context.get(SKIP_GLOBAL_NOTIFY) === true;
        if (!skipNotify) {
          this.handleNetworkError(error);
        }
        return throwError(() => error);
      }),
      finalize(() => {
        if (!shouldSkipLoading) {
          this.loadingService.setGlobalLoading(false, request.url);
        }
      })
    );
  }

  private handleNetworkError(error: HttpErrorResponse): void {
    // No forzar expiración en 401 aquí; AuthInterceptor decide si el token está realmente caducado.
    if (error.status === 401) {
      return;
    }

    // No notificar errores de validación (400) si tienen estructura de dominio
    // (estos los maneja el componente o GlobalErrorHandler)
    if (error.status === 400 && error.error?.validationErrors) return;

    // Manejar errores de conexión/red
    if (error.status === 0) {
      this.toastService.showError(
        'No se puede conectar con el servidor. Verifica tu conexión a internet.',
        'Error de Conexión'
      );
      return;
    }

    // Manejar códigos de estado específicos
    switch (error.status) {
      case 403:
        this.toastService.showWarning(
          'No tienes permisos para realizar esta acción.',
          'Acceso Denegado'
        );
        break;

      case 404:
        // Opcional: No mostrar error global para 404 si se maneja localmente
        // this.notificationService.warning('El recurso solicitado no existe.');
        break;

      case 408:
        this.toastService.showWarning(
          'La solicitud tardó demasiado tiempo. Intenta nuevamente.',
          'Tiempo de espera agotado'
        );
        break;

      case 429:
        this.toastService.showWarning(
          'Demasiadas peticiones. Por favor, espera un momento.',
          'Límite excedido'
        );
        break;

      case 500:
        this.toastService.showError(
          'Error interno del servidor. Por favor, intenta más tarde.',
          'Error del Servidor'
        );
        break;

      case 502:
      case 503:
      case 504:
        this.toastService.showError(
          'El servidor no está disponible en este momento. Por favor, intenta más tarde.',
          'Servidor no disponible'
        );
        break;

      default:
        if (error.status >= 400 && error.status < 500) {
          this.toastService.showError(
            'Error en la petición. Verifica los datos e intenta nuevamente.',
            'Error'
          );
        } else if (error.status >= 500) {
          this.toastService.showError(
            'Error del servidor. Por favor, intenta más tarde.',
            'Error del Servidor'
          );
        }
        break;
    }
  }
}
