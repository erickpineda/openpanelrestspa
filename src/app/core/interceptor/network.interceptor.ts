import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { HttpContextToken } from '@angular/common/http';
import { LoadingService } from '../services/ui/loading.service';
import { NotificationService } from '../services/ui/notification.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class NetworkInterceptor implements HttpInterceptor {
  // URLs que NO deben activar el loading global
  private excludedUrls = [
    'assets/',
    'i18n/',
    'sockjs-node/',
    '/api/v1/auth/refreshToken', // No mostrar loading para refresh token
    '/api/v1/usuarios/perfil/yo', // Peticiones rápidas de perfil
  ];

  // URLs que son consideradas "silenciosas" (no muestran errores)
  private silentUrls = [
    '/api/v1/auth/refreshToken',
    '/api/v1/prueba', // Ejemplo: notificaciones en background
  ];

  // Timeout por defecto (30 segundos)
  private defaultTimeout = 30000;

  // Cache de peticiones activas para evitar duplicados
  private activeRequests = new Map<string, number>();

  constructor(
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private logger: LoggerService
  ) {}

  // Contexto para saltar loader global sin enviar cabeceras al servidor (evita CORS)
  public static readonly SKIP_GLOBAL_LOADER = new HttpContextToken<boolean>(() => false);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const requestKey = this.generateRequestKey(request);
    const shouldSkipLoading = this.shouldSkipLoading(request);
    const isSilentRequest = this.isSilentRequest(request);

    // Evitar peticiones duplicadas
    if (this.activeRequests.has(requestKey)) {
      this.logger.debug(`Petición duplicada detectada: ${request.method} ${request.url}`);
      // Aquí podrías retornar un observable vacío o la petición existente
      // return of(); // Opción: cancelar duplicados
    }

    this.activeRequests.set(requestKey, Date.now());

    // Iniciar loading si no está excluida
    if (!shouldSkipLoading) {
      this.loadingService.setGlobalLoading(true);
    }

    // Clonar la request para agregar headers y timeout
    let modifiedRequest = this.addAuthHeaders(request);
    modifiedRequest = this.addContentType(modifiedRequest);

    return next.handle(modifiedRequest).pipe(
      // Timeout global
      timeout(this.defaultTimeout),

      // Manejo de errores
      catchError((error: HttpErrorResponse) => {
        this.handleError(error, request, isSilentRequest);
        return throwError(() => error);
      }),

      // Finalización
      finalize(() => {
        this.activeRequests.delete(requestKey);

        if (!shouldSkipLoading) {
          this.loadingService.setGlobalLoading(false);
        }

        this.logRequestCompletion(request);
      })
    );
  }

  // ===== MÉTODOS AUXILIARES =====

  private generateRequestKey(request: HttpRequest<unknown>): string {
    return `${request.method}-${request.urlWithParams}-${JSON.stringify(request.body)}`;
  }

  private shouldSkipLoading(request: HttpRequest<unknown>): boolean {
    const skipByContext = request.context.get(NetworkInterceptor.SKIP_GLOBAL_LOADER) === true;
    if (skipByContext) return true;
    return this.excludedUrls.some((url) => request.url.includes(url));
  }

  private isSilentRequest(request: HttpRequest<unknown>): boolean {
    return this.silentUrls.some((url) => request.url.includes(url));
  }

  private addAuthHeaders(request: HttpRequest<unknown>): HttpRequest<unknown> {
    // Aquí puedes agregar lógica para añadir headers de autenticación
    // si no lo estás haciendo ya en otro interceptor
    return request;
  }

  private addContentType(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const isApi = request.url.includes('/api/');
    const isFormData = typeof FormData !== 'undefined' && request.body instanceof FormData;

    let headersToSet: { [name: string]: string } = {};

    if (isApi && !request.headers.has('Accept')) {
      headersToSet['Accept'] = 'application/json';
    }

    if (
      isApi &&
      !isFormData &&
      !request.headers.has('Content-Type') &&
      (request.method === 'GET' ||
        request.method === 'DELETE' ||
        request.method === 'POST' ||
        request.method === 'PUT' ||
        request.method === 'PATCH')
    ) {
      headersToSet['Content-Type'] = 'application/json';
    }

    if (Object.keys(headersToSet).length > 0) {
      return request.clone({ setHeaders: headersToSet });
    }

    return request;
  }

  private handleError(
    error: HttpErrorResponse,
    request: HttpRequest<unknown>,
    isSilent: boolean
  ): void {
    const errorContext = {
      url: request.url,
      method: request.method,
      status: error.status,
      message: error.message,
      timestamp: new Date().toISOString(),
    };

    // Log del error - Usar warn para errores 4xx (cliente) para no ensuciar la consola con errores esperados
    const logMessage = `Error HTTP ${error.status} en ${request.method} ${request.url}`;
    if (error.status >= 400 && error.status < 500) {
      this.logger.warn(logMessage, error);
    } else {
      this.logger.error(logMessage, error);
    }

    // No mostrar notificaciones para peticiones silenciosas
    if (isSilent) return;

    // Manejo específico por tipo de error
    switch (error.status) {
      case 0:
        // Error de conexión
        this.notificationService.error(
          'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
        );
        break;

      case 401:
        // No autorizado - manejado por AuthInterceptor
        break;

      case 403:
        this.notificationService.error('No tienes permisos para realizar esta acción.');
        break;

      case 404:
        this.notificationService.warning('El recurso solicitado no fue encontrado.');
        break;

      case 429:
        this.notificationService.warning('Demasiadas peticiones. Por favor, espera un momento.');
        break;

      case 500:
        this.notificationService.error('Error interno del servidor. Por favor, intenta más tarde.');
        break;

      case 502:
      case 503:
      case 504:
        this.notificationService.error(
          'El servidor no está disponible en este momento. Por favor, intenta más tarde.'
        );
        break;

      default:
        if (error.status >= 400 && error.status < 500) {
          this.notificationService.error(
            'Error en la petición. Verifica los datos e intenta nuevamente.'
          );
        } else if (error.status >= 500) {
          this.notificationService.error('Error del servidor. Por favor, intenta más tarde.');
        }
        break;
    }
  }

  private logRequestCompletion(request: HttpRequest<unknown>): void {
    const duration = this.activeRequests.get(this.generateRequestKey(request));
    if (duration) {
      const requestTime = Date.now() - duration;
      this.logger.debug(`Petición completada: ${request.method} ${request.url} (${requestTime}ms)`);
    }
  }

  // Método para obtener estadísticas (útil para debugging)
  getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }

  getActiveRequests(): string[] {
    return Array.from(this.activeRequests.keys());
  }

  // Método para cancelar todas las peticiones activas (útil en logout)
  cancelAllRequests(): void {
    this.logger.warn(`Cancelando ${this.activeRequests.size} peticiones activas`);
    this.activeRequests.clear();
  }
}
