import { Component, OnInit } from '@angular/core';
import { NotificationService, NotificationOptions } from '../../../core/services/ui/notification.service';

@Component({
    selector: 'app-global-notifications',
    template: `
    <c-toaster placement="top-end" position="fixed">
      @for (notification of notifications; track notification) {
        <c-toast
          [autohide]="true"
          [delay]="notification.duration || 5000"
          [color]="getToastColor(notification.type)"
          (visibleChange)="removeNotification(notification)">
          <c-toast-header>
            <strong class="me-auto">{{ notification.title }}</strong>
          </c-toast-header>
          <c-toast-body>
            {{ notification.message }}
          </c-toast-body>
        </c-toast>
      }
    </c-toaster>
    `,
    standalone: false
})
export class GlobalNotificationsComponent implements OnInit {
  notifications: NotificationOptions[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notification$.subscribe(notification => {
      this.notifications.push(notification);
    });
  }

  getToastColor(type: string): string {
    const colors: { [key: string]: string } = {
      success: 'success',
      error: 'danger',
      warning: 'warning',
      info: 'info'
    };
    return colors[type] || 'info';
  }

  removeNotification(notification: NotificationOptions): void {
    this.notifications = this.notifications.filter(n => n !== notification);
  }
}