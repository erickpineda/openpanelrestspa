// core/errors/global-error/global-error-handler.service.ts - VERSIÓN MEJORADA
import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../services/ui/toast.service';
import { environment } from '../../../../environments/environment.dev.es';
import { LoggerService } from '../../services/logger.service';

export interface AppError {
  id: string;
  timestamp: Date;
  message: string;
  context?: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'http' | 'component' | 'service' | 'unknown' | 'validation';
  originalError?: any;
  validationErrors?: string[];
}

export interface BackendErrorResponse {
  result: {
    trackingId: string;
    timestamp: string;
    success: boolean;
    message: string;
  };
  error: {
    timestamp: string;
    status: number;
    message: string;
    details: string[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandlerService implements ErrorHandler {
  private errorCount = 0;
  private readonly maxErrors = 20;

  constructor(
    private injector: Injector,
    private ngZone: NgZone,
    private log: LoggerService,
  ) {
    // ✅ Capturar errores de promesas no manejadas
    this.setupUnhandledPromiseRejectionHandler();
  }

  handleError(error: any): void {
    this.ngZone.run(() => {
      this.errorCount++;

      if (this.errorCount > this.maxErrors) {
        this.log.error('🛑 Demasiados errores, evitando notificaciones');
        return;
      }

      this.log.info('🔥 [GLOBAL HANDLER] Error recibido:', error);

      const appError = this.normalizeError(error);
      this.processError(appError);
    });
  }

  private normalizeError(error: any): AppError {
    const isBackendError = this.isBackendErrorResponse(error);
    const isHttpError = error instanceof HttpErrorResponse;

    this.log.info('🔍 [NORMALIZE] isBackendError:', isBackendError);
    this.log.info('🔍 [NORMALIZE] isHttpError:', isHttpError);
    this.log.info('🔍 [NORMALIZE] error structure:', error);

    return {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: error?.message || 'Error desconocido',
      context: this.getErrorContext(),
      userMessage: this.getUserFriendlyMessage(error),
      severity: this.determineSeverity(error),
      category: isBackendError ? 'validation' : this.categorizeError(error),
      originalError: error,
      validationErrors: isBackendError
        ? this.extractValidationErrors(error)
        : undefined,
    };
  }

  // ✅ Nuevo método para capturar rechazos de promesas
  private setupUnhandledPromiseRejectionHandler(): void {
    if (typeof window !== 'undefined' && window.addEventListener) {
      const handler = (event: any) => {
        try {
          event?.preventDefault?.();
        } catch {}

        this.log.info(
          '🔍 [PROMISE] Unhandled rejection capturado:',
          event?.reason,
        );

        const promiseError = this.normalizePromiseRejection(event?.reason);
        this.handleError(promiseError);
      };

      window.addEventListener('unhandledrejection', handler as any, true);

      try {
        const previous = (window as any).onunhandledrejection;
        (window as any).onunhandledrejection = (event: any) => {
          handler(event);
          if (typeof previous === 'function') {
            return previous.call(window, event);
          }
          return false;
        };
      } catch {}
    }
  }

  // ✅ Normalizar errores de promesas
  private normalizePromiseRejection(rejection: any): any {
    // Si ya es un HttpErrorResponse, usarlo directamente
    if (rejection instanceof HttpErrorResponse) {
      return rejection;
    }

    // Si es el objeto de error de tu backend, crear un HttpErrorResponse simulado
    if (rejection && rejection.error && rejection.error.result) {
      const status =
        typeof rejection.status === 'number'
          ? rejection.status
          : typeof rejection.error?.error?.status === 'number'
            ? rejection.error.error.status
            : 0;
      return new HttpErrorResponse({
        error: rejection.error,
        status,
        statusText: rejection.statusText || 'Promise Rejection',
        url: rejection.url || rejection.error?.result?.trackingId,
      });
    }

    // Para otros tipos de rechazos
    return new Error(
      `Unhandled Promise rejection: ${rejection?.message || rejection}`,
    );
  }

  private processError(error: AppError): void {
    // Log diferenciado por ambiente
    if (this.isDevelopment()) {
      console.group('🐛 Error capturado - Desarrollo');
      this.log.warn('Tipo:', error.category);
      this.log.warn('Mensaje:', error.message);
      this.log.warn('Contexto:', error.context);
      if (error.validationErrors) {
        this.log.warn('Validaciones:', error.validationErrors);
      }
      console.groupEnd();
    } else {
      // En producción, log mínimo
      this.log.info(`📨 Error [${error.category}]: ${error.message}`);
    }

    this.showUserNotification(error);

    if (error.severity === 'critical') {
      this.handleCriticalError(error);
    }
  }

  private showUserNotification(error: AppError): void {
    const toastService = this.injector.get(ToastService);

    if (error.severity === 'low' && !this.isDevelopment()) {
      return;
    }

    // ✅ PRIMERO verificar si es error de validación
    if (error.validationErrors && error.validationErrors.length > 0) {
      this.showValidationErrors(error, toastService);
      return;
    }

    // Si no es validación, mostrar mensaje genérico
    switch (error.severity) {
      case 'critical':
      case 'high':
        toastService.showError(error.userMessage, 'Error');
        break;
      case 'medium':
        toastService.showWarning(error.userMessage, 'Advertencia');
        break;
      case 'low':
        toastService.showInfo(error.userMessage, 'Información');
        break;
    }
  }

  private showValidationErrors(
    error: AppError,
    toastService: ToastService,
  ): void {
    if (error.validationErrors && error.validationErrors.length > 0) {
      if (error.validationErrors.length === 1) {
        // Un solo error - mostrar directamente
        const cleanMessage = this.cleanValidationMessage(
          error.validationErrors[0],
        );
        toastService.showError(cleanMessage, 'Error de Validación');
      } else {
        // Múltiples errores
        const mainError = this.cleanValidationMessage(
          error.validationErrors[0],
        );
        const additionalCount = error.validationErrors.length - 1;
        const message =
          additionalCount > 0
            ? `${mainError} (+${additionalCount} error${additionalCount > 1 ? 'es' : ''} más)`
            : mainError;

        toastService.showError(message, 'Errores de Validación');

        if (this.isDevelopment()) {
          this.log.warn(
            '📋 Todos los errores de validación:',
            error.validationErrors,
          );
        }
      }
    }
  }

  // ✅ Limpiar mensajes de validación (remover "entradaDTO : ")
  private cleanValidationMessage(message: string): string {
    return message.replace(/^\w+?\s*:\s*/, ''); // Remover "entradaDTO : " del inicio
  }

  private handleCriticalError(error: AppError): void {
    const router = this.injector.get(Router);

    if (!router.url.includes('/error')) {
      router.navigate(['/error', 'critical'], {
        state: { error: this.sanitizeErrorForRouting(error) },
      });
    }
  }

  private getUserFriendlyMessage(error: any): string {
    this.log.info('🔍 [USER MESSAGE] Tipo de error:', typeof error);
    this.log.info(
      '🔍 [USER MESSAGE] error instanceof HttpErrorResponse:',
      error instanceof HttpErrorResponse,
    );

    if (error instanceof HttpErrorResponse) {
      return this.getHttpErrorMessage(error);
    }

    if (error?.message?.includes('Network Error')) {
      return 'Error de red. Verifique su conexión a internet.';
    }

    return 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.';
  }

  private getHttpErrorMessage(error: HttpErrorResponse): string {
    this.log.info('🔍 [HTTP ERROR] Status:', error.status);
    this.log.info('🔍 [HTTP ERROR] Error body:', error.error);

    // ✅ PRIMERO verificar si es error de validación de nuestro backend
    if (this.isBackendErrorResponse(error)) {
      this.log.info('🔍 [HTTP ERROR] Es error de validación del backend');
      const details = error.error.error.details;
      if (details.length === 1) {
        return this.cleanValidationMessage(details[0]);
      } else {
        return `Se encontraron ${details.length} errores de validación`;
      }
    }

    // Si no es de validación, manejar otros casos HTTP
    switch (error.status) {
      case 0:
        return 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
      case 400:
        return 'Solicitud incorrecta. Verifique los datos enviados.';
      case 401:
        return 'No autorizado. Por favor, inicie sesión nuevamente.';
      case 403:
        return 'No tiene permisos para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no fue encontrado.';
      case 409:
        return 'Conflicto: El recurso ya existe o ha sido modificado.';
      case 429:
        return 'Demasiadas solicitudes. Por favor, espere un momento.';
      case 500:
        return 'Error interno del servidor. Por favor, intente más tarde.';
      case 503:
        return 'Servicio no disponible. Estamos en mantenimiento.';
      default:
        return `Error de conexión (${error.status}). Por favor, intente nuevamente.`;
    }
  }

  private isBackendErrorResponse(
    error: any,
  ): error is HttpErrorResponse & { error: BackendErrorResponse } {
    if (!error || !error.error) {
      return false;
    }

    const hasValidStructure =
      error.error.result &&
      error.error.error &&
      Array.isArray(error.error.error.details);

    this.log.info('🔍 [BACKEND CHECK] Estructura válida:', hasValidStructure);
    return hasValidStructure;
  }

  private extractValidationErrors(error: any): string[] {
    if (this.isBackendErrorResponse(error)) {
      return error.error.error.details || [];
    }
    return [];
  }

  private determineSeverity(error: any): AppError['severity'] {
    if (this.isBackendErrorResponse(error)) {
      return 'medium'; // Errores de validación son medios (usuario puede corregirlos)
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0 || error.status >= 500) return 'high';
      if (error.status === 404 || error.status === 403) return 'medium';
      return 'low';
    }

    if (error?.ngDebugContext) return 'critical';

    return 'medium';
  }

  private categorizeError(error: any): AppError['category'] {
    if (this.isBackendErrorResponse(error)) {
      return 'validation';
    }
    if (error instanceof HttpErrorResponse) return 'http';
    if (error?.ngDebugContext) return 'component';
    return 'unknown';
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getErrorContext(): string {
    try {
      const router = this.injector.get(Router);
      return router.url;
    } catch {
      return 'unknown';
    }
  }

  private sanitizeErrorForRouting(error: AppError): Partial<AppError> {
    const { originalError, ...sanitized } = error;
    return sanitized;
  }

  private isDevelopment(): boolean {
    return environment.mock;
  }

  public resetErrorCount(): void {
    this.errorCount = 0;
  }

  public getValidationErrors(error: any): string[] {
    if (this.isBackendErrorResponse(error)) {
      return this.extractValidationErrors(error);
    }
    return [];
  }
}
