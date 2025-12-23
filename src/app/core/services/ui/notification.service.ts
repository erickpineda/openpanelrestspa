import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface NotificationOptions {
  title?: string;
  message: string;
  duration?: number;
  type: 'success' | 'error' | 'warning' | 'info';
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<NotificationOptions>();
  public notification$ = this.notificationSubject.asObservable();

  private defaultDuration = 5000;

  show(options: NotificationOptions): void {
    const notification = {
      duration: this.defaultDuration,
      ...options,
    };
    this.notificationSubject.next(notification);
  }

  success(message: string, title?: string): void {
    this.show({ type: 'success', message, title });
  }

  error(message: string, title?: string): void {
    this.show({ type: 'error', message, title });
  }

  warning(message: string, title?: string): void {
    this.show({ type: 'warning', message, title });
  }

  info(message: string, title?: string): void {
    this.show({ type: 'info', message, title });
  }
}
