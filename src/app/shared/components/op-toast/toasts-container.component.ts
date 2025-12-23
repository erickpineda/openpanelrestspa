import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastService } from '../../../core/services/ui/toast.service'; // ajusta ruta
import { ToastMessage } from '../../../core/models/toast.model'; // ajusta ruta

@Component({
  selector: 'app-toasts-container',
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
          #toast="cToast"
        >
          <c-toast-header [ngClass]="headerClass(toast)" [closeButton]="false">
            <strong class="me-auto">{{ toast.title || 'Notificación' }}</strong>
            @if (toast.delay) {
              <small class="text-muted">{{
                dateAsString(toast.createdAt)
              }}</small>
            }
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              (click)="$event.stopPropagation(); onClose(toast)"
            ></button>
          </c-toast-header>
          <c-toast-body>
            @if (toast.html) {
              <div [innerHTML]="toast.body"></div>
            } @else {
              {{ toast.body }}
            }
          </c-toast-body>
        </c-toast>
      }
    </c-toaster>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ToastsContainerComponent {
  public toasts$: Observable<ToastMessage[]>;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }

  headerClass(toast: ToastMessage) {
    switch (toast.color) {
      case 'danger':
        return 'bg-danger text-white';
      case 'warning':
        return 'bg-warning text-dark';
      case 'success':
        return 'bg-success text-white';
      case 'info':
        return 'bg-info text-dark';
      case 'primary':
        return 'bg-primary text-white';
      case 'secondary':
        return 'bg-secondary text-white';
      default:
        return '';
    }
  }

  onVisibleChange(visible: boolean, toast: ToastMessage) {
    if (!visible && toast.id) {
      this.toastService.removeById(toast.id);
    }
  }

  onClose(toast: ToastMessage) {
    if (toast.id) this.toastService.removeById(toast.id);
  }

  // Pausar temporizador while el mouse está encima
  onMouseEnter(toast: ToastMessage) {
    if (!toast.id) return;
    this.toastService.pauseTimer(toast.id);
  }

  // Reanudar temporizador cuando el mouse sale
  onMouseLeave(toast: ToastMessage) {
    if (!toast.id) return;
    this.toastService.resumeTimer(toast.id);
  }

  dateAsString(fecha: number): string {
    const date = new Date(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }
}
