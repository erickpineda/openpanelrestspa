import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastService } from '../../../core/services/ui/toast.service';
import { ToastMessage } from '../../../core/models/toast.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-global-notifications',
  template: `
    <c-toaster placement="top-end" class="p-3" position="fixed">
      @for (toast of toasts$ | async; track toast) {
        <c-toast
          [visible]="true"
          [autohide]="toast.autohide ?? true"
          [delay]="toast.delay"
          (visibleChange)="onVisibleChange($event, toast)"
          (mouseenter)="onMouseEnter(toast)"
          (mouseleave)="onMouseLeave(toast)"
          class="toast-modern mb-3 border-0 bg-transparent"
        >
          <div class="toast-content d-flex overflow-hidden bg-white shadow-lg rounded-3 position-relative">
            <!-- Indicador lateral -->
            <div class="toast-indicator" [style.background-color]="getIndicatorColor(toast)"></div>
            
            <!-- Icono -->
            <div class="toast-icon-wrapper d-flex align-items-center justify-content-center px-3" 
                 [style.color]="getIndicatorColor(toast)"
                 [style.background-color]="getIconBgColor(toast)">
               <div [innerHTML]="getIcon(toast)"></div>
            </div>

            <!-- Cuerpo -->
            <div class="toast-body-content py-3 ps-2 pe-5 flex-grow-1">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <strong class="text-dark fw-bold">{{ toast.title || getDefaultTitle(toast) }}</strong>
                <small class="text-muted ms-2" style="font-size: 0.75rem;">{{ dateAsString(toast.createdAt) }}</small>
              </div>
              <div class="text-secondary small message-text">
                @if (toast.html) {
                  <div [innerHTML]="toast.body"></div>
                } @else {
                  {{ toast.body }}
                }
              </div>
            </div>

            <!-- Botón cerrar -->
            <button
              type="button"
              class="btn-close position-absolute top-0 end-0 m-3"
              style="font-size: 0.7rem;"
              aria-label="Close"
              (click)="$event.stopPropagation(); onClose(toast)"
            ></button>
            
            <!-- Barra de progreso (opcional) -->
            <div *ngIf="toast.autohide && toast.delay" 
                 class="progress-bar-timer" 
                 [style.background-color]="getIndicatorColor(toast)"
                 [style.animation-duration.ms]="toast.delay">
            </div>
          </div>
        </c-toast>
      }
    </c-toaster>
  `,
  styles: [`
    .toast-modern {
      min-width: 320px;
      max-width: 450px;
      animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .toast-content {
      border: 1px solid rgba(0,0,0,0.03);
      min-height: 80px;
    }

    .toast-indicator {
      width: 5px;
      flex-shrink: 0;
    }

    .toast-icon-wrapper {
      min-width: 60px;
    }

    .message-text {
      line-height: 1.4;
      font-size: 0.9rem;
    }

    .progress-bar-timer {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      transform-origin: left;
      animation: progress linear forwards;
      opacity: 0.5;
    }

    @keyframes progress {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }

    @keyframes slideInRight {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class GlobalNotificationsComponent {
  public toasts$: Observable<ToastMessage[]>;

  constructor(
    private toastService: ToastService,
    private sanitizer: DomSanitizer
  ) {
    this.toasts$ = this.toastService.toasts$;
  }

  onVisibleChange(visible: boolean, toast: ToastMessage) {
    if (!visible && toast.id) {
      this.toastService.removeById(toast.id);
    }
  }

  onClose(toast: ToastMessage) {
    if (toast.id) this.toastService.removeById(toast.id);
  }

  onMouseEnter(toast: ToastMessage) {
    if (!toast.id) return;
    this.toastService.pauseTimer(toast.id);
    // Nota: La animación CSS no se pausa fácilmente sin JS complejo, 
    // pero funcionalmente el timer se pausa.
  }

  onMouseLeave(toast: ToastMessage) {
    if (!toast.id) return;
    this.toastService.resumeTimer(toast.id);
  }

  dateAsString(fecha: number): string {
    const date = new Date(fecha);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  getIndicatorColor(toast: ToastMessage): string {
    switch (toast.color) {
      case 'success': return '#2eb85c'; // CoreUI Success
      case 'danger': return '#e55353'; // CoreUI Danger
      case 'warning': return '#f9b115'; // CoreUI Warning
      case 'info': return '#39f'; // CoreUI Info
      default: return '#321fdb'; // CoreUI Primary
    }
  }

  getIconBgColor(toast: ToastMessage): string {
    // Versión muy clara del color principal para el fondo del icono
    switch (toast.color) {
      case 'success': return '#f2fcf5'; 
      case 'danger': return '#fdf4f4'; 
      case 'warning': return '#fef9e8'; 
      case 'info': return '#f1f8ff'; 
      default: return '#f2f2fe'; 
    }
  }

  getDefaultTitle(toast: ToastMessage): string {
    switch (toast.color) {
      case 'success': return '¡Éxito!';
      case 'danger': return 'Error';
      case 'warning': return 'Advertencia';
      case 'info': return 'Información';
      default: return 'Notificación';
    }
  }

  getIcon(toast: ToastMessage): SafeHtml {
    let svg = '';
    const size = '24';
    
    switch (toast.color) {
      case 'success': // Check Circle
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        break;
      case 'danger': // Alert Circle / X
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        break;
      case 'warning': // Alert Triangle
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        break;
      case 'info': // Info
      default:
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        break;
    }
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
