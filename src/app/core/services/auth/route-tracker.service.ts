import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TokenStorageService } from './token-storage.service';
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
    private log: LoggerService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        try {
          const url = event.urlAfterRedirects || event.url;
          // No guardar rutas públicas, login ni session-expired
          if (
            url.startsWith('/login') ||
            url.startsWith('/session-expired') ||
            url.startsWith('/public') ||
            url === '/' // puedes ajustar según tus rutas públicas
          ) {
            this.log.info('RouteTracker: ignorando ruta pública o de login/session-expired', url);
            return;
          }
          // Solo guardar si el usuario está autenticado
          if (!this.tokenStorage.isLoggedIn()) {
            this.log.info('RouteTracker: no se guarda ruta, usuario no autenticado');
            return;
          }

          // Protección: si justo se ha manejado un post-login (otra parte escribió
          // 'post-login-handled-{tabId}' con timestamp), ignoramos guardados durante
          // un breve periodo para evitar sobrescribir la ruta restaurada.
          try {
            const tabKey = this.tokenStorage.getPostLoginKeyForThisTab();
            const handledKey = 'post-login-handled-' + tabKey;
            const ts = window.sessionStorage.getItem(handledKey);
            if (ts) {
              const age = Date.now() - Number(ts || '0');
              if (age >= 0 && age < 1000) {
                // Ignorar este NavigationEnd porque es probable resultado de la restauración post-login
                this.log.info('RouteTracker: Ignorando guardado por post-login-handled (age ms)', age);
                return;
              } else {
                // Si la marca es vieja, eliminarla
                try { window.sessionStorage.removeItem(handledKey); } catch (e) {}
              }
            }
          } catch (e) {
            // ignore errors reading handled flag
          }
          // Guardar en memoria la última ruta válida
          RouteTrackerService.lastValidUrl = url;
          // Guardar en sessionStorage
          const key = this.tokenStorage.getPostLoginKeyForThisTab();
          try { window.sessionStorage.setItem(key, url); } catch (e) {}
          try { localStorage.setItem(key, url); } catch (e) {}
          this.log.info('RouteTracker: guardada ruta válida para post-login redirect', key, url);
        } catch (e) {
          this.log.error('RouteTracker: error guardando ruta actual', e);
        }
      });
  }
}
