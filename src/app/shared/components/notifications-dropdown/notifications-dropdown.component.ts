import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';

export type NotificationType = 'temporary' | 'info' | 'system' | 'critical';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  unread: boolean;
}

@Component({
  selector: 'app-notifications-dropdown',
  templateUrl: './notifications-dropdown.component.html',
  styleUrls: ['./notifications-dropdown.component.scss'],
  standalone: false,
})
export class NotificationsDropdownComponent {
  @Input() items: NotificationItem[] = [];
  @Input() unreadCount = 0;
  @Input() labelHeader = 'Notificaciones';
  @Input() labelMarkAll = 'Marcar todas como leídas';
  @Input() labelViewAll = 'Ver todas';

  @Output() markAllRead = new EventEmitter<void>();
  @Output() itemMarkedRead = new EventEmitter<string>();
  @Output() itemDismissed = new EventEmitter<string>();
  @Output() viewAll = new EventEmitter<void>();

  open = false;
  markingAsReadIds = new Set<string>();

  constructor(private elementRef: ElementRef) {}

  toggleOpen(): void {
    this.open = !this.open;
  }

  close(): void {
    this.open = false;
  }

  handleMarkAll(): void {
    this.markAllRead.emit();
  }

  handleMarkRead(id: string): void {
    this.markingAsReadIds.add(id);
    // Wait for animation to complete before emitting
    setTimeout(() => {
      this.itemMarkedRead.emit(id);
      // Clean up the set after a bit more time (just in case the item remains)
      setTimeout(() => {
        this.markingAsReadIds.delete(id);
      }, 100);
    }, 300);
  }

  handleDismiss(id: string): void {
    this.itemDismissed.emit(id);
  }

  timeAgo(ts: number): string {
    const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    const minutes = Math.floor(diff / 60);
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(diff / 86400);
    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} h`;
    if (minutes > 0) return `Hace ${minutes} min`;
    return `Hace ${diff} s`;
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(ev.target);
    if (!clickedInside) {
      this.close();
    }
  }
}
