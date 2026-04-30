import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';
import { DashboardApiService } from '../core/services/dashboard-api.service';
import { TranslationService } from '../core/services/translation.service';
import { LanguageService } from '../core/services/language.service';
import { Subscription, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { iconSubset } from '../shared/components/icons/coreui-icons';
import { navItems } from './default-layout/_nav';
import { TemporaryStorageService } from '../core/services/ui/temporary-storage.service';
import { LoggerService } from '../core/services/logger.service';
import { LoadingService } from '../core/services/ui/loading.service';
import { ToastService } from '../core/services/ui/toast.service';
import { TokenStorageService } from '../core/services/auth/token-storage.service';
import { AuthService } from '../core/services/auth/auth.service';
import { SidebarStateService } from '../core/services/ui/sidebar-state.service';
import { NavigationService } from '../core/services/ui/navigation.service';
import { UserRole, INavItemEnhanced } from '../shared/types/navigation.types';
import { OPStorageConstants } from '@app/shared/constants/op-storage.constants';
import { OpPrivilegioConstants } from '../shared/constants/op-privilegio.constants';

// ... imports existentes

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {
  // ✅ NUEVO: Propiedades para controlar la notificación
  showGlobalRecoveryNotification = false;
  temporaryEntriesCount = 0;

  public navItems: INavItemEnhanced[] = navItems;
  private navSubscription: Subscription | undefined;
  private destroy$ = new Subject<void>();
  public userRole: UserRole = UserRole.LECTOR;
  public cargaFinalizada: boolean = false;
  public projectsCount: number = 0;
  public notificationsCount: number = 0;
  public tasksCount: number = 0;
  public messagesCount: number = 0;
  public commentsCount: number = 0;

  public isAuthed: boolean = false;
  public ready: boolean = false;
  public sidebarNarrow: boolean = false;
  public sidebarVisible: boolean = true;
  public sidebarBackdrop: boolean = false;

  // Propiedades para el componente de recuperación
  showRecoveryNotification = false;
  recoveryData: any[] = [];

  constructor(
    private router: Router,
    private titleService: Title,
    private iconSetService: IconSetService,
    private temporaryStorage: TemporaryStorageService,
    private log: LoggerService,
    public loadingService: LoadingService,
    private toastService: ToastService,
    private dashboardApi: DashboardApiService,
    private cdr: ChangeDetectorRef,
    private tokenStorage: TokenStorageService,
    private authService: AuthService,
    private sidebarState: SidebarStateService,
    private navigationService: NavigationService,
    private translationService: TranslationService,
    private languageService: LanguageService
  ) {
    this.iconSetService.icons = { ...iconSubset };
  }

  // Etiquetas del header (para i18n/bindings)
  public labelDashboard = 'Escritorio';
  public labelUsers = 'Usuarios';
  public labelGoHome = 'Ir a inicio';
  public labelAccount = 'Account';
  public labelUpdates = 'Updates';
  public labelMessages = 'Messages';
  public labelTasks = 'Tasks';
  public labelComments = 'Comments';
  public labelSettings = 'Settings';
  public labelProfile = 'Profile';
  // eliminado: etiqueta de pagos
  public labelProjects = 'Projects';
  public labelLockAccount = 'Lock Account';

  ngOnInit(): void {
    const ok = this.tokenStorage.isLoggedIn() && this.authService.isTokenValid(30);
    if (!ok) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }
    this.isAuthed = true;
    this.ready = true;

    // Establecer rol del usuario para la navegación usando el servicio centralizado
    this.userRole = this.tokenStorage.getUserRole();

    // Inicializar NavigationService con los items base
    this.navigationService.setNavigationItems(navItems);

    // Suscribirse a los items procesados (filtrados y con badges)
    this.navSubscription = this.navigationService
      .getNavigationItems(this.userRole)
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.navItems = items;
        this.applyTranslationsInPlace(this.navItems);
        this.sidebarState.updateNavItems(this.navItems, this.router.url);
        this.cdr.markForCheck();
      });

    this.checkForTemporaryData();
    this.cargaFinalizada = true;

    // Suscribirse a cambios en las traducciones (se dispara cuando se carga el idioma o cambia)
    this.translationService.translations$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateTranslations();
      // Actualizar traducciones IN-PLACE para no romper referencias
      this.refreshSidebar();
    });

    const isDashboardRoute =
      this.router.url.includes('/admin/dashboard') || this.router.url.includes('/admin/control');
    const currentPrivileges = this.tokenStorage.getUser()?.privileges;
    const canReadDashboardStats =
      Array.isArray(currentPrivileges) &&
      currentPrivileges.includes(OpPrivilegioConstants.VER_DASHBOARD);
    if (isDashboardRoute && canReadDashboardStats) {
      this.dashboardApi
        .getContentStats()
        .pipe(takeUntil(this.destroy$))
        .subscribe((stats) => {
          this.projectsCount = Number(stats?.totalEntradas) || 0;
          this.commentsCount = Number(stats?.totalComentarios) || 0;
          this.messagesCount = this.commentsCount;
          this.cdr.markForCheck();
        });
    }
    this.toastService.toasts$.pipe(takeUntil(this.destroy$)).subscribe((list) => {
      this.notificationsCount = Array.isArray(list) ? list.length : 0;
      this.cdr.markForCheck();
    });
    this.tasksCount = this.temporaryEntriesCount;
    this.cdr.markForCheck();

    // Estado inicial del sidebar (persistencia)
    this.sidebarNarrow = this.readSidebarNarrowFromStorage();

    // Check viewport for initial sidebar visibility on mobile
    const currentWidth = window.innerWidth;
    if (currentWidth < 992) {
      this.sidebarVisible = false;
      this.sidebarBackdrop = true;
    } else {
      this.sidebarVisible = true;
      this.sidebarBackdrop = false;
    }

    this.cdr.markForCheck();

    // Actualizar estado de sidebar en inicio y en cambios de ruta
    this.sidebarState.updateNavItems(this.navItems, this.router.url);
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.sidebarState.updateNavItems(this.navItems, this.router.url);
        this.checkForTemporaryData();

        // Close sidebar on mobile after navigation
        if (window.innerWidth < 992) {
          this.sidebarVisible = false;
        }

        this.cdr.markForCheck();
      });

    // Escuchar cambios en localStorage para actualizar el banner inmediatamente
    window.addEventListener('storage', this.onStorageChange as any);

    this.temporaryStorage.entriesChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkForTemporaryData();
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    try {
      this.checkForTemporaryData();
      this.cdr.detectChanges();
    } catch {}
  }

  private onStorageChange = (ev: StorageEvent) => {
    try {
      if (!ev || !ev.key) return;
      if (ev.key === OPStorageConstants.TEMPORARY_ENTRIES_KEY) {
        this.checkForTemporaryData();
        this.cdr.markForCheck();
      }
    } catch {}
  };

  private checkForTemporaryData(): void {
    const temporaryEntries = this.temporaryStorage.getAllTemporaryEntries();
    this.temporaryEntriesCount = temporaryEntries.length;

    if (this.temporaryEntriesCount > 0) {
      this.log.info('📥 Datos temporales encontrados en admin:', temporaryEntries);

      // Estrategia nueva: usar dropdown de notificaciones en el header, sin banner global
      this.showGlobalRecoveryNotification = false;
      this.tasksCount = this.temporaryEntriesCount;
      this.cdr.markForCheck();
    } else {
      this.showGlobalRecoveryNotification = false;
      this.tasksCount = 0;
    }
  }

  onRecoverData(): void {
    this.showRecoveryNotification = false;
    this.router.navigate(['/admin/control/entradas/entradas-temporales']);
  }

  // ✅ MODIFICADO: Siempre redirigir al listado de entradas temporales
  onGlobalRecover(): void {
    this.showGlobalRecoveryNotification = false;
    this.router.navigate(['/admin/control/entradas/entradas-temporales']);
  }

  onGlobalIgnore(): void {
    this.showGlobalRecoveryNotification = false;
    this.log.info('ℹ️ Usuario ignoró la notificación global de recuperación');
  }

  onGlobalDiscard(): void {
    this.showGlobalRecoveryNotification = false;
    this.temporaryStorage.clearAllTemporaryEntries();
    this.log.info('🗑️ Usuario descartó todos los datos temporales');
  }

  private updateTranslations(): void {
    this.labelDashboard = this.translationService.translate('MENU.DASHBOARD');
    this.labelUsers = this.translationService.translate('MENU.USERS');
    this.labelGoHome = this.translationService.translate('MENU.VIEW_WEBSITE');
    this.labelAccount = this.translationService.translate('MENU.MY_ACCOUNT');
    this.labelUpdates = this.translationService.translate('MENU.UPDATES');
    this.labelMessages = this.translationService.translate('MENU.MESSAGES');
    this.labelTasks = this.translationService.translate('MENU.TASKS');
    this.labelComments = this.translationService.translate('MENU.COMMENTS');
    this.labelSettings = this.translationService.translate('MENU.SETTINGS');
    this.labelProfile = this.translationService.translate('MENU.MY_PROFILE');
    this.labelProjects = this.translationService.translate('MENU.PROJECTS');
    this.labelLockAccount = this.translationService.translate('MENU.LOCK_ACCOUNT');
  }

  private updateNavItems(): void {
    // MÉTODO DEPRECADO EN FAVOR DE applyTranslationsInPlace
    // Se mantiene por compatibilidad si es llamado desde otro lugar, pero ahora usa la lógica in-place
    this.refreshSidebar();
  }

  /**
   * Aplica traducciones mutando directamente los objetos existentes para preservar referencias.
   * Traduce nombres y badges usando la clave persistida.
   */
  private applyTranslationsInPlace(items: any[]): void {
    items.forEach((item) => {
      if (!item.translationKey) {
        item.translationKey = item.name;
      }

      // Traducir nombre
      if (item.translationKey) {
        const translated = this.translationService.translate(item.translationKey);
        // Solo actualizar si la traducción es diferente a la clave o si es un título que requiere traducción
        if (translated !== item.translationKey || item.title) {
          item.name = translated;
        }
      }

      if (item.badge) {
        if (!item.badge.translationKey) {
          item.badge.translationKey = item.badge.text;
        }
        const key = item.badge.translationKey;
        if (key === 'MENU.BADGE_PENDING' || key === 'Pend') {
          item.badge.text = this.translationService.translate('MENU.BADGE_PENDING');
        } else {
          item.badge.text = this.translationService.translate(key);
        }
      }
      if (item.children) {
        this.applyTranslationsInPlace(item.children);
      }
    });
  }

  private refreshSidebar(): void {
    this.applyTranslationsInPlace(this.navItems);
    // Forzar actualización de referencia para detectar cambios en OnPush
    this.navItems = [...this.navItems];
    this.sidebarState.updateNavItems(this.navItems, this.router.url);
    this.cdr.markForCheck();
  }

  private filterItemsByRole(items: any[], role: UserRole): any[] {
    // Si es PROPIETARIO, ve todo, pero clonamos para tener nuestra propia estructura
    if (role === UserRole.PROPIETARIO) {
      return items.map((item) => {
        const copy = { ...item };
        if (copy.children) {
          copy.children = this.filterItemsByRole(copy.children, role);
        }
        return copy;
      });
    }

    const filtered: any[] = [];

    items.forEach((originalItem) => {
      // 0. Check requiredPermissions (si están presentes, prevalecen sobre roles)
      if (originalItem.requiredPermissions && originalItem.requiredPermissions.length > 0) {
        const user = this.tokenStorage.getUser();
        const privs: string[] = Array.isArray(user?.privileges) ? user.privileges : [];
        const set = new Set(privs);
        const mode: 'ANY' | 'ALL' = (originalItem.permissionMode as any) || 'ANY';
        const ok =
          mode === 'ALL'
            ? originalItem.requiredPermissions.every((p: string) => set.has(p))
            : originalItem.requiredPermissions.some((p: string) => set.has(p));
        if (!ok) {
          return;
        }
      }

      // 1. Check requiredRoles
      if (originalItem.requiredRoles && !originalItem.requiredRoles.includes(role)) {
        return;
      }

      // Clonar el item para no mutar el original de la configuración global
      const item = { ...originalItem };

      // 2. Filter children recursively
      if (item.children) {
        item.children = this.filterItemsByRole(item.children, role);

        // Si se queda sin hijos y no es un enlace directo (es un wrapper), lo descartamos
        if (item.children.length === 0 && item.url === undefined && !item.title) {
          return;
        }
      }

      filtered.push(item);
    });

    return filtered;
  }
  /*
  private translateItems(items: any[]): any[] {
     // MÉTODO ELIMINADO EN FAVOR DE applyTranslationsInPlace
     // ...
  }
*/
  private readSidebarNarrowFromStorage(): boolean {
    try {
      const raw = localStorage.getItem('sidebar_narrow');
      return raw === 'true';
    } catch {
      return false;
    }
  }

  private writeSidebarNarrowToStorage(value: boolean): void {
    try {
      localStorage.setItem('sidebar_narrow', value ? 'true' : 'false');
    } catch {}
  }

  public toggleSidebarNarrow(): void {
    this.sidebarNarrow = !this.sidebarNarrow;
    this.writeSidebarNarrowToStorage(this.sidebarNarrow);
    this.cdr.markForCheck();
  }

  public onVisibleChange(visible: boolean) {
    this.sidebarVisible = visible;
    this.cdr.markForCheck();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const width = event.target.innerWidth;
    const isMobile = width < 992;

    // Actualizar estado de backdrop
    this.sidebarBackdrop = isMobile;

    if (isMobile && this.sidebarVisible) {
      this.sidebarVisible = false;
      this.cdr.markForCheck();
    } else if (!isMobile && !this.sidebarVisible) {
      this.sidebarVisible = true;
      this.cdr.markForCheck();
    } else {
      // Asegurar actualización de vista si solo cambia backdrop
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    try {
      const width = window.innerWidth || document.documentElement.clientWidth;
      const isMobile = width < 992;
      if (!isMobile || !this.sidebarVisible) return;
      const sidebarEl = document.getElementById('sidebar');
      const target = event.target as Node | null;
      if (sidebarEl && target && !sidebarEl.contains(target)) {
        // Verificar si el click fue en el botón toggle para evitar cierre inmediato
        const toggler = document.querySelector('.header-toggler');
        if (toggler && toggler.contains(target)) {
          return;
        }

        this.sidebarVisible = false;
        this.cdr.markForCheck();
      }
    } catch {}
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.navSubscription) {
      this.navSubscription.unsubscribe();
    }
    try {
      window.removeEventListener('storage', this.onStorageChange as any);
    } catch {}
  }
}
