import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastService } from '../../../core/services/ui/toast.service';
import { ToastMessage } from '../../../core/models/toast.model';

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
          [color]="toast.color ?? ''"
          class="text-white align-items-center"
        >
          <c-toast-header [ngClass]="headerClass(toast)" [closeButton]="false">
            <strong class="me-auto">{{ toast.title || 'Notificación' }}</strong>
            @if (toast.delay) {
              <small class="text-white-50 ms-2">{{ dateAsString(toast.createdAt) }}</small>
            }
            <button
              cButtonClose
              class="ms-2 mb-1 white"
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
export class GlobalNotificationsComponent {
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

  onMouseEnter(toast: ToastMessage) {
    if (!toast.id) return;
    this.toastService.pauseTimer(toast.id);
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
}
