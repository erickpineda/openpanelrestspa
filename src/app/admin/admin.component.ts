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
    const ok =
      this.tokenStorage.isLoggedIn() && this.authService.isTokenValid(30);
    if (!ok) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }
    this.isAuthed = true;
    this.ready = true;
    this.checkForTemporaryData();
    this.cargaFinalizada = true;
    const locale =
      navigator && navigator.language ? navigator.language : 'es-ES';
    this.setHeaderLabels(locale);
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
      this.log.info(
        '📥 Datos temporales encontrados en admin:',
        temporaryEntries,
      );

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

  private setHeaderLabels(locale: string): void {
    this.labelDashboard = 'Escritorio';
    this.labelUsers = 'Usuarios';
    this.labelGoHome = 'Ir a inicio';
    this.labelAccount = 'Cuenta';
    this.labelUpdates = 'Actualizaciones';
    this.labelMessages = 'Mensajes';
    this.labelTasks = 'Tareas';
    this.labelComments = 'Comentarios';
    this.labelSettings = 'Ajustes';
    this.labelProfile = 'Perfil';
    // eliminado: etiqueta de pagos
    this.labelProjects = 'Proyectos';
    this.labelLockAccount = 'Bloquear cuenta';
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
