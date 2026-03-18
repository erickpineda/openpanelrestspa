import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastService } from '../../../core/services/ui/toast.service';
import { ToastMessage } from '../../../core/models/toast.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-global-notifications',
  templateUrl: './global-notifications.component.html',
  styleUrls: ['./global-notifications.component.scss'],
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
    const day = String(date.getDate()).padStart(2, '0');
    const months = [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];
    const month = months[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month} ${hours}:${minutes}`;
  }

  getIndicatorColor(toast: ToastMessage): string {
    switch (toast.color) {
      case 'success':
        return '#2eb85c'; // CoreUI Success
      case 'danger':
        return '#e55353'; // CoreUI Danger
      case 'warning':
        return '#f9b115'; // CoreUI Warning
      case 'info':
        return '#39f'; // CoreUI Info
      default:
        return '#321fdb'; // CoreUI Primary
    }
  }

  getIconBgColor(toast: ToastMessage): string {
    // Versión muy clara del color principal para el fondo del icono
    switch (toast.color) {
      case 'success':
        return '#f2fcf5';
      case 'danger':
        return '#fdf4f4';
      case 'warning':
        return '#fef9e8';
      case 'info':
        return '#f1f8ff';
      default:
        return '#f2f2fe';
    }
  }

  getDefaultTitle(toast: ToastMessage): string {
    switch (toast.color) {
      case 'success':
        return '¡Éxito!';
      case 'danger':
        return 'Error';
      case 'warning':
        return 'Advertencia';
      case 'info':
        return 'Información';
      default:
        return 'Notificación';
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
