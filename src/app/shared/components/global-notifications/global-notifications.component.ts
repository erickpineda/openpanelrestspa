import { Component, OnInit } from '@angular/core';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-global-notifications',
  template: `
    <c-toaster placement="top-end" position="fixed">
      <c-toast *ngFor="let notification of notifications" 
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
    </c-toaster>
  `
})
export class GlobalNotificationsComponent implements OnInit {
  notifications: Notification[] = [];

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

  removeNotification(notification: Notification): void {
    this.notifications = this.notifications.filter(n => n !== notification);
  }
}