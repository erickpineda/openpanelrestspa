import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { ClassToggleService, HeaderComponent } from '@coreui/angular';

@Component({
    selector: 'app-default-header',
    templateUrl: './default-header.component.html',
    standalone: false
})
export class DefaultHeaderComponent extends HeaderComponent {

  @Input() sidebarId: string = "sidebar";
  @Input() busy: boolean = false;
  @Input() labelDashboard: string = 'Escritorio';
  @Input() labelUsers: string = 'Usuarios';
  @Input() labelGoHome: string = 'Ir a inicio';
  @Input() labelAccount: string = 'Account';
  @Input() labelUpdates: string = 'Updates';
  @Input() labelMessages: string = 'Messages';
  @Input() labelTasks: string = 'Tasks';
  @Input() labelComments: string = 'Comments';
  @Input() labelSettings: string = 'Settings';
  @Input() labelProfile: string = 'Profile';
  @Input() labelProjects: string = 'Projects';
  @Input() labelLockAccount: string = 'Lock Account';
  @Input() projectsCount: number = 0;

  public newMessages = new Array(4)
  public newTasks = new Array(5)
  public newNotifications = new Array(5)
  public newComments = new Array(3)

  @Input() userCounts: { messages?: number; tasks?: number; notifications?: number; comments?: number } | null = null;

  public userMenuOpen = false;

  get messagesCount(): number { return this.userCounts?.messages ?? this.newMessages.length; }
  get tasksCount(): number { return this.userCounts?.tasks ?? this.newTasks.length; }
  get notificationsCount(): number { return this.userCounts?.notifications ?? this.newNotifications.length; }
  get commentsCount(): number { return this.userCounts?.comments ?? this.newComments.length; }

  constructor(private classToggler: ClassToggleService) {
    super();
  }
}
