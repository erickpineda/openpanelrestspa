import {
  HttpRequest,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
  HttpContextToken,
  HttpInterceptorFn,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { LoadingService } from '../services/ui/loading.service';
import { ToastService } from '../services/ui/toast.service';
import { LoggerService } from '../services/logger.service';

export const SKIP_GLOBAL_LOADER = new HttpContextToken<boolean>(() => false);
export const SKIP_GLOBAL_NOTIFY = new HttpContextToken<boolean>(() => false);

const skippedUrls = ['/assets/', '/i18n/', '/health'];

export const networkInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const loadingService = inject(LoadingService);
  const toastService = inject(ToastService);
  const log = inject(LoggerService);

  const shouldSkipLoading = req.context.get(SKIP_GLOBAL_LOADER) || skippedUrls.some((url) => req.url.includes(url));

  if (!shouldSkipLoading) {
    loadingService.setGlobalLoading(true, req.url);
  }

  const started = Date.now();

  const handleNetworkError = (error: HttpErrorResponse): void => {
    if (error.status === 401) return;
    if (error.status === 400 && error.error?.validationErrors) return;

    if (error.status === 0) {
      toastService.showError('No se puede conectar con el servidor. Verifica tu conexión a internet.', 'Error de Conexión');
      return;
    }

    switch (error.status) {
      case 404: break;
      case 408:
        toastService.showWarning('La solicitud tardó demasiado tiempo. Intenta nuevamente.', 'Tiempo de espera agotado');
        break;
      case 429:
        toastService.showWarning('Demasiadas peticiones. Por favor, espera un momento.', 'Límite excedido');
        break;
      case 500:
        toastService.showError('Error interno del servidor. Por favor, intenta más tarde.', 'Error del Servidor');
        break;
      case 502:
      case 503:
      case 504:
        toastService.showError('El servidor no está disponible en este momento. Por favor, intenta más tarde.', 'Servidor no disponible');
        break;
      default:
        if (error.status >= 400 && error.status < 500) {
          toastService.showError('Error en la petición. Verifica los datos e intenta nuevamente.', 'Error');
        } else if (error.status >= 500) {
          toastService.showError('Error del servidor. Por favor, intenta más tarde.', 'Error del Servidor');
        }
        break;
    }
  };

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const elapsed = Date.now() - started;
        if (elapsed > 1500) {
          log.warn(`🐢 Petición lenta: ${req.method} ${req.url} (${elapsed}ms)`);
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const skipNotify = req.context.get(SKIP_GLOBAL_NOTIFY) === true;
      if (!skipNotify) {
        handleNetworkError(error);
      }
      return throwError(() => error);
    }),
    finalize(() => {
      if (!shouldSkipLoading) {
        loadingService.setGlobalLoading(false, req.url);
      }
    })
  );
};
