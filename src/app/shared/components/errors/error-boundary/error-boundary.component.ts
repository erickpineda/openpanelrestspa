// core/errors/error-boundary/error-boundary.component.ts
import { Component, Input } from '@angular/core';
import {
  AppError,
  GlobalErrorHandlerService,
} from '../../../../core/errors/global-error/global-error-handler.service';
import { LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-error-boundary',
  template: `
    @if (!hasError) {
      <ng-content></ng-content>
    } @else {
      <c-alert color="warning" class="error-boundary p-3">
        <div class="d-flex align-items-start">
          <c-icon
            name="cil-warning"
            class="text-warning me-3"
            size="lg"
          ></c-icon>
          <div class="flex-fill">
            <h6 class="mb-1">{{ fallbackMessage }}</h6>
            <p class="mb-2 small text-muted">
              {{ fallbackDescription }}
            </p>
            <div
              class="btn-group btn-group-sm"
              role="group"
              aria-label="Acciones de error"
            >
              <button
                type="button"
                class="btn btn-outline-primary"
                (click)="retry()"
              >
                Reintentar
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                (click)="reset()"
              >
                Restablecer
              </button>
            </div>
          </div>
        </div>
        <!-- Detalles técnicos: mostrados solo en entorno no productivo -->
        @if (currentError && !isProduction) {
          <div class="mt-3">
            <details>
              <summary class="small cursor-pointer">Detalles técnicos</summary>
              <pre
                class="small mt-2 p-2 bg-light rounded"
              ><code>{{ currentError.message }}</code></pre>
            </details>
          </div>
        }
      </c-alert>
    }
  `,
  styles: [
    `
      .error-boundary {
        border-left: 4px solid #ffc107;
        background: #fff3cd;
      }
      .cursor-pointer {
        cursor: pointer;
      }
      /* Ajustes menores para que el icono no desplace contenido en pantallas pequeñas */
      @media (max-width: 575.98px) {
        .error-boundary .d-flex {
          flex-direction: row;
          gap: 0.5rem;
        }
        .error-boundary c-icon {
          margin-top: 0.2rem;
        }
      }
    `,
  ],
  standalone: false,
})
export class ErrorBoundaryComponent {
  @Input() fallbackMessage: string = 'Algo salió mal en este componente';
  @Input() fallbackDescription: string =
    'Puede intentar recargar o contactar soporte si el problema persiste.';
  @Input() context: string = '';
  @Input() autoRetry: boolean = false;

  hasError = false;
  currentError: AppError | null = null;
  private retryCount = 0;
  private readonly maxRetries = 2;

  constructor(
    private errorHandler: GlobalErrorHandlerService,
    private log: LoggerService,
  ) {}

  /**
   * Método público para que componentes hijos reporten errores.
   * Normaliza el error y activa la vista de fallback.
   */
  public captureError(error: any, componentName: string = ''): void {
    if (this.retryCount >= this.maxRetries) {
      this.log.error(`Máximo de reintentos alcanzado para ${componentName}`);
      return;
    }

    this.hasError = true;

    const normalizedError: AppError = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: error?.message || `Error en ${componentName}`,
      context: this.context || componentName,
      userMessage: this.fallbackMessage,
      severity: 'medium',
      category: 'component',
      originalError: error,
    };

    this.currentError = normalizedError;

    // Opcional: reportar al servicio global de errores
    try {
      this.errorHandler.handleError(normalizedError);
    } catch (e) {
      // Silenciar fallos del propio handler para no romper la UI
      this.log.warn('Error al notificar al GlobalErrorHandlerService', e);
    }

    // Auto-reintento si está configurado
    if (this.autoRetry && this.retryCount < this.maxRetries) {
      setTimeout(() => this.retry(), 1000 * (this.retryCount + 1));
    }
  }

  retry(): void {
    this.retryCount++;
    this.hasError = false;
    this.currentError = null;
    this.log.info(`Reintento ${this.retryCount} para ${this.context}`);
  }

  reset(): void {
    this.retryCount = 0;
    this.hasError = false;
    this.currentError = null;
  }

  public generateErrorId(): string {
    return `boundary_${this.context}_${Date.now()}`;
  }

  public get isProduction(): boolean {
    return !(
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
    );
  }
}
