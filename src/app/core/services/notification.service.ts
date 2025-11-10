import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notification$ = this.notificationSubject.asObservable();

  showSuccess(message: string, title: string = 'Éxito'): void {
    this.showNotification('success', title, message);
  }

  showError(message: string, title: string = 'Error'): void {
    this.showNotification('error', title, message);
  }

  showWarning(message: string, title: string = 'Advertencia'): void {
    this.showNotification('warning', title, message);
  }

  showInfo(message: string, title: string = 'Información'): void {
    this.showNotification('info', title, message);
  }

  private showNotification(type: Notification['type'], title: string, message: string, duration: number = 5000): void {
    this.notificationSubject.next({ type, title, message, duration });
  }
}