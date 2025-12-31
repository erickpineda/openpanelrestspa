import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ClassToggleService, HeaderComponent } from '@coreui/angular';

interface IBreadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-default-header',
  templateUrl: './default-header.component.html',
  standalone: false,
})
export class DefaultHeaderComponent extends HeaderComponent implements OnInit, OnDestroy {
  @Input() sidebarId: string = 'sidebar';
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

  public newMessages = new Array(4);
  public newTasks = new Array(5);
  public newNotifications = new Array(5);
  public newComments = new Array(3);

  public breadcrumbs: IBreadcrumb[] = [];
  private routerSubscription: Subscription | undefined;

  @Input() userCounts: {
    messages?: number;
    tasks?: number;
    notifications?: number;
    comments?: number;
  } | null = null;

  public userMenuOpen = false;

  get messagesCount(): number {
    return this.userCounts?.messages ?? this.newMessages.length;
  }
  get tasksCount(): number {
    return this.userCounts?.tasks ?? this.newTasks.length;
  }
  get notificationsCount(): number {
    return this.userCounts?.notifications ?? this.newNotifications.length;
  }
  get commentsCount(): number {
    return this.userCounts?.comments ?? this.newComments.length;
  }

  constructor(
    private classToggler: ClassToggleService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    this.breadcrumbs = this.createBreadcrumbs(this.router.routerState.root);
    
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbs = this.createBreadcrumbs(this.router.routerState.root);
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private createBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: IBreadcrumb[] = []
  ): IBreadcrumb[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      if (child.outlet !== 'primary') {
        continue;
      }

      const routeURL: string = child.snapshot.url.map((segment) => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      let label = child.snapshot.data['title'];
      
      // Fallback: usar parte de la URL si no hay título
      if (!label && routeURL !== '') {
        label = this.formatLabel(routeURL);
      }

      // Omitir el breadcrumb de nivel raíz '/admin' ya que se muestra como "Inicio" fijo
      if (label && url !== '/admin') {
        breadcrumbs.push({ label, url });
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }
    return breadcrumbs;
  }

  private formatLabel(text: string): string {
    return text
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
