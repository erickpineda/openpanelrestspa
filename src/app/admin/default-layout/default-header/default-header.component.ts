import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ClassToggleService, HeaderComponent } from '@coreui/angular';
import { LanguageService, Language } from '../../../core/services/language.service';
import { TranslationService } from '../../../core/services/translation.service';
import { SessionManagerService } from '../../../core/services/auth/session-manager.service';
import {
  TemporaryStorageService,
  TemporaryEntry,
} from '../../../core/services/ui/temporary-storage.service';
import { NotificationItem } from '../../../shared/components/notifications-dropdown/notifications-dropdown.component';
import { RightSidebarService } from '../../../core/services/ui/right-sidebar.service';
import { TokenStorageService } from '../../../core/services/auth/token-storage.service';
import { PerfilMediaService } from '../../../core/services/data/perfil-media.service';
import { UserRole } from '../../../shared/types/navigation.types';

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
  public avatarUrl = './assets/img/avatars/2.jpg';
  readonly defaultAvatarUrl = './assets/img/avatars/2.jpg';
  private avatarObjectUrl: string | null = null;
  currentLang: Language = 'es';
  notifications: NotificationItem[] = [];
  unreadNotifications = 0;
  private translationsSubscription: Subscription | undefined;
  private tempEntriesSubscription: Subscription | undefined;
  private avatarRefreshSubscription: Subscription | undefined;
  public canAccessControlPanel = false;
  private readonly controlPanelRoles: UserRole[] = [
    UserRole.AUTOR,
    UserRole.EDITOR,
    UserRole.ADMINISTRADOR,
    UserRole.DESARROLLADOR,
    UserRole.MANTENIMIENTO,
    UserRole.PROPIETARIO,
  ];
  private readonly perfilMediaService = inject(PerfilMediaService, { optional: true });

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
    private sessionManager: SessionManagerService,
    private temporaryStorage: TemporaryStorageService,
    private translationService: TranslationService,
    public rightSidebarService: RightSidebarService,
    private tokenStorage: TokenStorageService
  ) {
    super();
  }

  toggleRightSidebar() {
    this.rightSidebarService.toggle();
  }

  logout(): void {
    this.sessionManager.logout();
  }

  ngOnInit(): void {
    this.canAccessControlPanel = this.tokenStorage.hasAnyRole(this.controlPanelRoles);
    this.refreshAvatar();
    this.breadcrumbs = this.createBreadcrumbs(this.router.routerState.root);

    this.languageService.currentLang$.subscribe((lang: Language) => {
      this.currentLang = lang;
    });

    this.buildNotifications();
    this.tempEntriesSubscription = this.temporaryStorage.entriesChanged$.subscribe(() => {
      this.buildNotifications();
    });

    if (this.perfilMediaService) {
      this.avatarRefreshSubscription = this.perfilMediaService.avatarChanged$.subscribe(() => {
        this.loadAvatar();
      });
    }

    this.translationsSubscription = this.translationService.translations$.subscribe(() => {
      this.buildNotifications();
    });

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.refreshAvatar();
        this.breadcrumbs = this.createBreadcrumbs(this.router.routerState.root);
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.translationsSubscription) {
      this.translationsSubscription.unsubscribe();
    }
    if (this.tempEntriesSubscription) {
      this.tempEntriesSubscription.unsubscribe();
    }
    if (this.avatarRefreshSubscription) {
      this.avatarRefreshSubscription.unsubscribe();
    }
    this.revokeAvatarObjectUrl();
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  onAvatarError(): void {
    this.setDefaultAvatar();
  }

  private buildNotifications(): void {
    const temps: TemporaryEntry[] = this.temporaryStorage.getAllTemporaryEntries();
    const tempItems: NotificationItem[] = temps.map((t) => ({
      id: t.id,
      type: 'temporary',
      title: t.title || this.translationService.instant('ADMIN.RECOVERY.GLOBAL_TITLE'),
      message: this.translationService.instant('ADMIN.RECOVERY.STATUS'),
      timestamp: Date.parse(t.timestamp) || Date.now(),
      unread: !this.temporaryStorage.isRecoveryNotificationShown(t.id),
    }));
    this.notifications = tempItems;
    this.unreadNotifications = tempItems.filter((x) => x.unread).length;
  }

  private refreshAvatar(): void {
    this.loadAvatar();
  }

  private loadAvatar(): void {
    if (!this.perfilMediaService) {
      this.setDefaultAvatar();
      return;
    }

    this.perfilMediaService
      .getAvatarObjectUrl()
      .pipe(take(1))
      .subscribe({
        next: (avatarUrl) => {
          this.setAvatarUrl(avatarUrl);
        },
        error: () => {
          this.setDefaultAvatar();
        },
      });
  }

  private setAvatarUrl(avatarUrl: string): void {
    this.revokeAvatarObjectUrl();
    this.avatarObjectUrl = avatarUrl;
    this.avatarUrl = avatarUrl;
  }

  private setDefaultAvatar(): void {
    this.revokeAvatarObjectUrl();
    this.avatarUrl = this.defaultAvatarUrl;
  }

  private revokeAvatarObjectUrl(): void {
    if (this.avatarObjectUrl) {
      URL.revokeObjectURL(this.avatarObjectUrl);
      this.avatarObjectUrl = null;
    }
  }

  onMarkAllRead(): void {
    this.notifications.forEach((n) => {
      if (n.type === 'temporary') {
        this.temporaryStorage.setRecoveryNotificationShown(n.id);
      }
    });
    this.notifications = this.notifications.map((n) => ({ ...n, unread: false }));
    this.unreadNotifications = 0;
  }

  onItemMarkedRead(id: string): void {
    this.temporaryStorage.setRecoveryNotificationShown(id);
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.unreadNotifications = this.notifications.filter((x) => x.unread).length;
  }

  onItemDismissed(id: string): void {
    // Para temporales, descartar equivale a limpiar la entrada temporal
    this.temporaryStorage.removeTemporaryEntry(id);
    this.buildNotifications();
  }

  onViewAllNotifications(): void {
    this.router.navigate(['/admin/control/entradas/entradas-temporales']);
  }

  onNotificationOpened(id: string): void {
    // Por ahora navegamos al listado/detalle principal. El queryParam permite
    // enfocar/resaltar la notificación/entrada en el futuro sin romper compatibilidad.
    this.router.navigate(['/admin/control/entradas/entradas-temporales'], {
      queryParams: { focus: id },
    });
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
        const isControlPanelCrumb = url === '/admin/control' && label === 'MENU.CONTROL_PANEL';
        if (isControlPanelCrumb && !this.canAccessControlPanel) {
          return this.createBreadcrumbs(child, url, breadcrumbs);
        }
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

  canNavigateToBreadcrumb(url: string): boolean {
    if (url === '/admin/control') {
      return this.canAccessControlPanel;
    }
    return true;
  }
}
