import { Injectable } from '@angular/core';
import { TokenStorageService } from './token-storage.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

@Injectable({ providedIn: 'root' })
export class PostLoginRedirectService {
  private readonly REDIRECT_PREFIX = OPConstants.Session.POST_LOGIN_PREFIX;
  private readonly HANDLED_PREFIX =
    OPConstants.Session.POST_LOGIN_HANDLED_PREFIX;
  private readonly IGNORE_WINDOW_MS = OPConstants.Session.IGNORE_WINDOW_MS;

  constructor(private tokenStorage: TokenStorageService) {}

  // Guarda la ruta válida actual para la pestaña
  saveLastValidRoute(url: string): void {
    const key = this.getTabKey();
    try {
      window.sessionStorage.setItem(key, url);
    } catch {}
    try {
      localStorage.setItem(key, url);
    } catch {}
  }

  // Recupera y limpia la ruta guardada para la pestaña (o null)
  getAndClearRedirectForTab(): string | null {
    const key = this.getTabKey();
    let redirect: string | null = null;
    try {
      redirect = window.sessionStorage.getItem(key);
    } catch {}
    if (!redirect) {
      try {
        redirect = localStorage.getItem(key) ?? null;
      } catch {}
    }
    if (!redirect) {
      try {
        redirect =
          localStorage.getItem(OPConstants.Session.POST_LOGIN_REDIRECT) ?? null;
      } catch {}
    }
    // Fallback: buscar cualquier clave post-login-redirect- en sessionStorage
    if (!redirect) {
      try {
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const k = window.sessionStorage.key(i);
          if (k && k.indexOf(this.REDIRECT_PREFIX) === 0) {
            const v = window.sessionStorage.getItem(k);
            if (v) {
              redirect = v;
              break;
            }
          }
        }
      } catch {}
    }
    // Limpiar claves tras uso
    try {
      window.sessionStorage.removeItem(key);
    } catch {}
    try {
      localStorage.removeItem(OPConstants.Session.POST_LOGIN_REDIRECT);
    } catch {}
    return redirect;
  }

  // Marca la restauración post-login (protección anti-race)
  markPostLoginHandled(): void {
    const key = this.getTabKey();
    try {
      window.sessionStorage.setItem(
        this.HANDLED_PREFIX + key,
        Date.now().toString(),
      );
    } catch {}
  }

  // Devuelve true si debe ignorarse el guardado (protección anti-race)
  shouldIgnoreRouteSave(): boolean {
    const key = this.getTabKey();
    try {
      const ts = window.sessionStorage.getItem(this.HANDLED_PREFIX + key);
      if (ts) {
        const age = Date.now() - Number(ts);
        if (age >= 0 && age < this.IGNORE_WINDOW_MS) {
          return true;
        } else {
          window.sessionStorage.removeItem(this.HANDLED_PREFIX + key);
        }
      }
    } catch {}
    return false;
  }

  // Normaliza rutas para HashLocationStrategy
  normalizeRoute(url: string): string {
    if (!url) return '/';
    if (url.startsWith('/#')) {
      url = url.replace(/^\/#/, '');
    }
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    return url;
  }

  // Utilidad: clave de storage para la pestaña actual
  private getTabKey(): string {
    return this.REDIRECT_PREFIX + this.tokenStorage.getOrCreateTabId();
  }
}
