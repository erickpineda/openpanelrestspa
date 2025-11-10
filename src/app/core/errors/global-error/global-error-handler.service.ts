import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { OpenpanelApiResponse } from '../../models/openpanel-api-response.model';
import { ToastService } from '../../services/ui/toast.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {

  constructor(private injector: Injector) {}

  handleError(error: any): void {
    const router = this.injector.get(Router);
    const toastService = this.injector.get(ToastService);

    let errorResponse: OpenpanelApiResponse<any>;
    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error instanceof HttpErrorResponse) {
      errorResponse = this.mapHttpErrorToApiResponse(error);

      // 1) Si la API devuelve detalles de validación (array), mostramos un solo toast formateado
      const details: string[] = errorResponse.error?.details ?? [];
      if (details.length) {
        // limpiamos/pulimos cada detalle (opcional: quitar prefijos como 'entradaDTO : ')
        const cleaned = details.map(d => {
          // si viene con 'algo : mensaje', extraemos solo la parte después de ':'
          const parts = d.split(':');
          if (parts.length > 1) {
            // unir todo menos la primera parte, y trim
            return parts.slice(1).join(':').trim();
          }
          return d.trim();
        });

        // construimos HTML con <ul><li>...</li></ul>
        const listHtml = `<ul style="margin:0; padding-left:1rem;">${cleaned.map(s => `<li>${this.escapeHtml(s)}</li>`).join('')}</ul>`;

        toastService.showError(listHtml, 'Errores de validación', { html: true, delay: 8000 });
        // evitamos el toast genérico (Http failure ...)
        return;
      }

      // 2) Si hay un message funcional en result y success=false
      if (errorResponse.result?.message && errorResponse.result.success === false) {
        toastService.showError(errorResponse.result.message, 'Error', { delay: 6000 });
        return;
      }

      // 3) Errores de red / servidor genéricos
      if (error.status === 0) {
        toastService.showError('Error de conexión: No se puede conectar al servidor.', 'Error');
        return;
      } else if (error.status >= 500) {
        toastService.showError('Error del servidor interno.', 'Error');
        router.navigate(['/error']);
        return;
      } else {
        // Fallback: mostrar mensaje del HttpErrorResponse pero evitando el mensaje crudo de Angular si ya mostramos el backend
        toastService.showError(errorResponse.error?.message || error.message || 'Error HTTP', 'Error');
        return;
      }

    } else if (error.rejection && error.rejection.error?.result) {
      errorResponse = error.rejection.error;
      if (errorResponse.result?.message) {
        toastService.showError(errorResponse.result.message, 'Error funcional');
        return;
      }
    } else {
      // Error del cliente
      errorResponse = {
        result: {
          trackingId: '',
          timestamp: new Date().toISOString(),
          success: false,
          message: error?.message ? error.message : 'Error inesperado'
        }
      };
      errorMessage = errorResponse.result.message;
      toastService.showError(errorMessage, 'Error');
      return;
    }
  }

  private mapHttpErrorToApiResponse(error: HttpErrorResponse): OpenpanelApiResponse<any> {
    return {
      result: {
        trackingId: error.error?.result?.trackingId || '',
        timestamp: error.error?.result?.timestamp || new Date().toISOString(),
        success: error.error?.result?.success ?? false,
        message: error.error?.result?.message || error.message
      },
      error: {
        timestamp: error.error?.error?.timestamp || new Date().toISOString(),
        status: error.error?.error?.status || error.status,
        message: error.message || 'Unknown Error',
        path: error.url || '',
        details: error.error?.error?.details || []
      }
    };
  }

  /**
   * Escapa caracteres especiales para evitar que cadenas inesperadas rompan el HTML.
   * Ya que Angular sanitiza innerHTML, esto es adicional (y útil si decides bypassear).
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
