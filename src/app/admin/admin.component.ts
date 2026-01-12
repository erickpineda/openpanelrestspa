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

import { iconSubset } from '../shared/components/icons/icon-subset';
import { navItems } from './default-layout/_nav';
import { TemporaryStorageService } from '../core/services/ui/temporary-storage.service';
import { LoggerService } from '../core/services/logger.service';
import { LoadingService } from '../core/services/ui/loading.service';
import { ToastService } from '../core/services/ui/toast.service';
import { TokenStorageService } from '../core/services/auth/token-storage.service';
import { AuthService } from '../core/services/auth/auth.service';
import { SidebarStateService } from '../core/services/ui/sidebar-state.service';

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
    this.checkForTemporaryData();
    this.cargaFinalizada = true;

    // Suscribirse a cambios en las traducciones (se dispara cuando se carga el idioma o cambia)
    this.translationService.translations$.subscribe(() => {
      this.updateTranslations();
      this.updateNavItems();
      this.cdr.markForCheck();
    });

    const isDashboardRoute = this.router.url.includes('/admin/base/dashboard');
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
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  private checkForTemporaryData(): void {
    const temporaryEntries = this.temporaryStorage.getAllTemporaryEntries();
    this.temporaryEntriesCount = temporaryEntries.length;

    if (this.temporaryEntriesCount > 0) {
      this.log.info('📥 Datos temporales encontrados en admin:', temporaryEntries);

      // ✅ MODIFICADO: Siempre mostrar notificación múltiple, incluso con una sola entrada
      this.showGlobalRecoveryNotification = true;
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
    // Usar spread para crear copias superficiales y evitar perder funciones (como en contextualActions)
    // JSON.stringify eliminaba las funciones, rompiendo la UI si se esperaban
    this.navItems = this.translateItems(navItems);
    this.sidebarState.updateNavItems(this.navItems, this.router.url);
  }

  private translateItems(items: any[]): any[] {
    return items.map((originalItem) => {
      // Copia superficial para no mutar el objeto original
      const item = { ...originalItem };

      if (item.name) {
        item.name = this.translationService.translate(item.name);
      }
      if (item.badge && item.badge.text) {
        // Clonar badge para no mutar el original
        item.badge = { ...item.badge };
        
        // Traducir badge si es una clave de traducción (contiene MENU. o similar) o es texto fijo
        // Asumiremos que si empieza por MENU. es clave, si no, intentamos traducir igual por si acaso
        if (item.badge.text === 'Pend' || item.badge.text === 'MENU.BADGE_PENDING') {
             item.badge.text = this.translationService.translate('MENU.BADGE_PENDING');
        } else {
             item.badge.text = this.translationService.translate(item.badge.text);
        }
      }
      if (item.children) {
        item.children = this.translateItems(item.children);
      }
      return item;
    });
  }

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
}
