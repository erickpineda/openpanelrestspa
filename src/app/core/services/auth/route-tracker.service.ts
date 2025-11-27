import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TokenStorageService } from './token-storage.service';
import { PostLoginRedirectService } from './post-login-redirect.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { LoggerService } from '../logger.service';

@Injectable({ providedIn: 'root' })
export class RouteTrackerService {
  private static lastValidUrl: string | null = null;
  public static getLastValidUrl(): string | null {
    return RouteTrackerService.lastValidUrl;
  }

  constructor(
    private router: Router,
    private tokenStorage: TokenStorageService,
    private log: LoggerService,
    private postLoginRedirect: PostLoginRedirectService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        try {
          const url = event.urlAfterRedirects || event.url;
          // No guardar rutas públicas, login ni session-expired
          if (
            url.startsWith(OPConstants.Session.ROUTE_LOGIN) ||
            url.startsWith(OPConstants.Session.ROUTE_SESSION_EXPIRED) ||
            url.startsWith('/public') ||
            url === OPConstants.Session.ROUTE_HOME // puedes ajustar según tus rutas públicas
          ) {
            this.log.info('RouteTracker: ignorando ruta pública o de login/session-expired', url);
            return;
          }
          // Solo guardar si el usuario está autenticado
          if (!this.tokenStorage.isLoggedIn()) {
            this.log.info('RouteTracker: no se guarda ruta, usuario no autenticado');
            return;
          }

          // Protección anti-race centralizada
          if (this.postLoginRedirect.shouldIgnoreRouteSave()) {
            this.log.info('RouteTracker: Ignorando guardado por post-login-handled (anti-race)');
            return;
          }
          // Guardar en memoria la última ruta válida
          RouteTrackerService.lastValidUrl = url;
          // Guardar usando el servicio centralizado
          this.postLoginRedirect.saveLastValidRoute(url);
          this.log.info('RouteTracker: guardada ruta válida para post-login redirect', url);
        } catch (e) {
          this.log.error('RouteTracker: error guardando ruta actual', e);
        }
      });
  }
}
