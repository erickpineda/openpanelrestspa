import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';
import { DashboardApiService } from '../core/services/dashboard-api.service';
import { TranslationService } from '../core/services/translation.service';
import { LanguageService } from '../core/services/language.service';

import { iconSubset } from '../shared/components/icons/coreui-icons';
import { navItems } from './default-layout/_nav';
import { TemporaryStorageService } from '../core/services/ui/temporary-storage.service';
import { LoggerService } from '../core/services/logger.service';
import { LoadingService } from '../core/services/ui/loading.service';
import { ToastService } from '../core/services/ui/toast.service';
import { TokenStorageService } from '../core/services/auth/token-storage.service';
import { AuthService } from '../core/services/auth/auth.service';
import { SidebarStateService } from '../core/services/ui/sidebar-state.service';
import { UserRole } from '../shared/types/navigation.types';
import { OPStorageConstants } from '@app/shared/constants/op-storage.constants';

// ... imports existentes

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdminComponent implements OnInit, AfterViewInit {
  // ✅ NUEVO: Propiedades para controlar la notificación
  showGlobalRecoveryNotification = false;
  temporaryEntriesCount = 0;

  public navItems = navItems;
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

    // Filtrar items según rol antes de cualquier traducción (ESTABLECER ESTRUCTURA INICIAL UNA ÚNICA VEZ)
    this.navItems = this.filterItemsByRole(navItems, this.userRole);

    // Aplicar traducciones iniciales sobre la estructura ya creada
    this.applyTranslationsInPlace(this.navItems);

    this.checkForTemporaryData();
    this.cargaFinalizada = true;

    // Suscribirse a cambios en las traducciones (se dispara cuando se carga el idioma o cambia)
    this.translationService.translations$.subscribe(() => {
      this.updateTranslations();
      // Actualizar traducciones IN-PLACE para no romper referencias
      this.applyTranslationsInPlace(this.navItems);
      this.sidebarState.updateNavItems(this.navItems, this.router.url);
      this.cdr.markForCheck();
    });

    const isDashboardRoute =
      this.router.url.includes('/admin/dashboard') || this.router.url.includes('/admin/control');
    if (isDashboardRoute) {
      this.dashboardApi.getContentStats().subscribe((stats) => {
        this.projectsCount = Number(stats?.totalEntradas) || 0;
        this.commentsCount = Number(stats?.totalComentarios) || 0;
        this.messagesCount = this.commentsCount;
        this.cdr.markForCheck();
      });
    }
    this.toastService.toasts$.subscribe((list) => {
      this.notificationsCount = Array.isArray(list) ? list.length : 0;
      this.cdr.markForCheck();
    });
    this.tasksCount = this.temporaryEntriesCount;
    this.cdr.markForCheck();

    // Estado inicial del sidebar (persistencia)
    this.sidebarNarrow = this.readSidebarNarrowFromStorage();
    this.cdr.markForCheck();

    // Actualizar estado de sidebar en inicio y en cambios de ruta
    this.sidebarState.updateNavItems(this.navItems, this.router.url);
    this.router.events.subscribe(() => {
      this.sidebarState.updateNavItems(this.navItems, this.router.url);
      this.checkForTemporaryData();
      this.cdr.markForCheck();
    });

    // Escuchar cambios en localStorage para actualizar el banner inmediatamente
    window.addEventListener('storage', this.onStorageChange as any);

    this.temporaryStorage.entriesChanged$.subscribe(() => {
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
    this.applyTranslationsInPlace(this.navItems);
    this.sidebarState.updateNavItems(this.navItems, this.router.url);
  }

  /**
   * Aplica traducciones mutando directamente los objetos existentes para preservar referencias.
   * Esto evita el error NG0956 (recreación de colección) en componentes CoreUI.
   */
  private applyTranslationsInPlace(items: any[]): void {
    items.forEach((item) => {
      // 1. Persistir clave de nombre original la primera vez
      if (!item.translationKey) {
        item.translationKey = item.name;
      }

      // 2. Traducir nombre usando la clave persistida
      if (item.translationKey) {
        item.name = this.translationService.translate(item.translationKey);
      }

      // 3. Persistir y traducir Badge
      if (item.badge) {
        if (!item.badge.translationKey) {
          item.badge.translationKey = item.badge.text;
        }

        const key = item.badge.translationKey;
        // Lógica específica para badges conocidos
        if (key === 'MENU.BADGE_PENDING' || key === 'Pend') {
          item.badge.text = this.translationService.translate('MENU.BADGE_PENDING');
        } else {
          item.badge.text = this.translationService.translate(key);
        }
      }

      // 4. Recursividad para hijos
      if (item.children) {
        this.applyTranslationsInPlace(item.children);
      }
    });
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

  ngOnDestroy(): void {
    try {
      window.removeEventListener('storage', this.onStorageChange as any);
    } catch {}
  }
}
