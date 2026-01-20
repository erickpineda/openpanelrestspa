import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ClassToggleService, HeaderComponent } from '@coreui/angular';
import { LanguageService, Language } from '../../../core/services/language.service';
import { SessionManagerService } from '../../../core/services/auth/session-manager.service';

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
  currentLang: Language = 'es';

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
    private route: ActivatedRoute,
    public languageService: LanguageService,
    private sessionManager: SessionManagerService
  ) {
    super();
  }

  logout(): void {
    this.sessionManager.logout();
  }

  ngOnInit(): void {
    this.breadcrumbs = this.createBreadcrumbs(this.router.routerState.root);

    this.languageService.currentLang$.subscribe((lang: Language) => {
      this.currentLang = lang;
    });

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

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
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
      const routeURL: string = child.snapshot.url.map((segment) => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data['title'];
      if (label) {
        // Evitar duplicados consecutivos (mismo label)
        const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        if (!lastBreadcrumb || lastBreadcrumb.label !== label) {
          breadcrumbs.push({ label, url });
        }
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }
    return breadcrumbs;
  }
}
