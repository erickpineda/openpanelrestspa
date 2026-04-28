// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TokenStorageService } from './core/services/auth/token-storage.service';
import { AuthSyncService } from './core/services/auth/auth-sync.service';
import { LoggerService } from './core/services/logger.service';
import { AuthService } from './core/services/auth/auth.service'; // inyectado para comprobar token
import { RouteTrackerService } from './core/services/auth/route-tracker.service';
import { OPConstants } from './shared/constants/op-global.constants';
import { GlobalErrorHandlerService } from './core/errors/global-error/global-error-handler.service';
import { UiAnomalyMonitorService } from './core/services/ui/ui-anomaly-monitor.service';
import { ToastService } from './core/services/ui/toast.service';
import { TranslationService } from './core/services/translation.service';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from '@shared/components/icons/coreui-icons';
import { GtmService } from './core/services/analytics/gtm.service';
import { AnalyticsRouterService } from './core/services/analytics/analytics-router.service';
import { ReaderPreferencesService } from './features/public/services/reader-preferences.service';
import { UserInteractionsSyncService } from './core/services/sync/user-interactions-sync.service';
import { ThemeRuntimeService } from './features/public/services/theme-runtime.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnInit {
  title = 'openpanelspa';
  loading: boolean = false;
  private lastPreviewFallbackAt = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authSync: AuthSyncService,
    private log: LoggerService,
    private authService: AuthService,
    private routeTracker: RouteTrackerService, // sólo para activar el tracking
    private tokenStorage: TokenStorageService,
    private globalErrorHandler: GlobalErrorHandlerService,
    private uiMonitor: UiAnomalyMonitorService,
    private toast: ToastService,
    private i18n: TranslationService,
    private iconSetService: IconSetService,
    private gtm: GtmService,
    private analyticsRouter: AnalyticsRouterService,
    private readerPrefs: ReaderPreferencesService,
    private userInteractionsSync: UserInteractionsSyncService,
    private themeRuntime: ThemeRuntimeService
  ) {
    this.iconSetService.icons = { ...iconSubset };
  }

  ngOnInit(): void {
    this.gtm.init();
    this.analyticsRouter.start();

    // Inicializar sincronización de interacciones del usuario (bookmarks, likes, prefs)
    this.userInteractionsSync.init();

    // Inicializar sincronización entre pestañas
    this.authSync.initializeAuthState();

    // Luego comprobar token actual (si está caducado forzará logout)
    this.authService.ensureTokenValidOnInit();

    // Mantenimiento periódico de post-login-redirect + limpieza inicial
    this.tokenStorage.cleanExpiredPostLoginRedirects();
    this.tokenStorage.startPostLoginRedirectMaintenance(60 * 60 * 1000);

    // Escuchar cambios de estado de autenticación
    window.addEventListener(OPConstants.Events.AUTH_STATE_CHANGED, () => {
      this.log.info('🔄 Estado de autenticación cambiado, actualizando interfaz...');
      // Aquí podrías forzar la actualización de componentes si es necesario
    });

    this.uiMonitor.start();

    // Limpieza preventiva: evitar que localStorage se llene con previews (puede afectar al sync de auth entre pestañas).
    this.cleanupThemePreviewStorage();

    // Safety check: ensure no stale backdrops or overlays are blocking the UI on startup
    setTimeout(() => {
      this.uiMonitor.scanAndRecover('startup_safety');
    }, 2000);

    // Aplicar tema activo / preview al iniciar y en cada navegación (incluye /admin directo).
    this.themeRuntime.initFromRoute(this.route).subscribe();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.themeRuntime.initFromRoute(this.route).subscribe();
    });

    // Aviso UX: si el preview por token falla y se hace fallback a tema activo,
    // mostramos un toast para evitar sensación de "aleatorio".
    try {
      window.addEventListener('op-theme-preview-fallback', (ev: any) => {
        const now = Date.now();
        // throttle suave para evitar spam (por retries)
        if (now - this.lastPreviewFallbackAt < 1500) return;
        this.lastPreviewFallbackAt = now;
        const kind = String(ev?.detail?.kind || '');
        const body =
          kind === 'custom_css_blocked'
            ? this.i18n.instant('ADMIN.THEMES.PREVIEW_CUSTOMCSS_BLOCKED')
            : this.i18n.instant('ADMIN.THEMES.PREVIEW_FALLBACK');
        const title = this.i18n.instant('MENU.THEMES');
        this.toast.showInfo(body, title, { delay: 6000 });
      });
    } catch {}
  }

  private cleanupThemePreviewStorage() {
    try {
      const now = Date.now();
      const cleanup = (prefix: string, maxEntries: number, maxAgeMs: number) => {
        const items: Array<{ key: string; ts: number }> = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith(prefix)) continue;
          const raw = localStorage.getItem(k) || '';
          let ts = 0;
          try {
            const obj: any = JSON.parse(raw);
            ts = Date.parse(obj?.createdAt || '');
          } catch {}
          const safeTs = isNaN(ts) ? 0 : ts;
          items.push({ key: k, ts: safeTs });
        }
        // Age
        items.forEach(({ key, ts }) => {
          if (ts > 0 && now - ts > maxAgeMs) {
            localStorage.removeItem(key);
          }
        });
        // Max
        if (items.length > maxEntries) {
          const sorted = items.sort((a, b) => (b.ts || 0) - (a.ts || 0));
          sorted.slice(maxEntries).forEach(({ key }) => localStorage.removeItem(key));
        }
      };

      cleanup('op-theme-local-preview:', 20, 24 * 60 * 60 * 1000);
      cleanup('op-theme-preview-meta:', 20, 24 * 60 * 60 * 1000);
    } catch {}
  }
}
