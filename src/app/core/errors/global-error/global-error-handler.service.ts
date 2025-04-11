import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { OpenpanelApiResponse } from '../../models/openpanel-api-response.model';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {

  constructor(private injector: Injector) {}

  handleError(error: any): void {
    const router = this.injector.get(Router);
    let errorMessage = 'Ha ocurrido un error desconocido';
    let errorResponse: OpenpanelApiResponse<any>;

    if (error instanceof HttpErrorResponse) {
      errorResponse = this.mapHttpErrorToApiResponse(error);
      errorMessage = error.status === 0 ? 
        'Error de conexión: No se puede conectar al servidor.' : 
        `Error del servidor: ${errorResponse.error?.details?.join(', ') || error.message}`;
    } else if (error.rejection && error.rejection.error?.result) {
      // Si el error proviene de una promesa rechazadas
      errorResponse = error.rejection.error;
      errorMessage = errorResponse.error?.details?.join(', ') || 'Error inesperado';
    } else {
      // Error del cliente
      errorResponse = {
        result: {
          trackingId: '',
          timestamp: new Date().toISOString(),
          success: false,
          message: error.message ? error.message : 'Error inesperado'
        }
      };
      errorMessage = errorResponse.result.message;
    }

    console.error(`Global Error Handler: ${errorMessage}`);

    if (errorResponse.error && errorResponse.error.status === 500) {
      router.navigate(['/error']);
    }

    // Aquí puedes integrar servicios como ngx-toastr para notificar al usuario
  }

  private mapHttpErrorToApiResponse(error: HttpErrorResponse): OpenpanelApiResponse<any> {
    return {
      result: {
        trackingId: error.error?.result?.trackingId || '',
        timestamp: error.error?.result?.timestamp || new Date().toISOString(),
        success: error.error?.result?.success || false,
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
}
