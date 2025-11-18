// src/app/core/services/auth/token-storage.service.ts
import { Injectable } from '@angular/core';
import { LoggerService } from '../logger.service';

export const TOKEN_KEY = 'auth-token';
export const USER_KEY = 'auth-user';
export const SYNC_TOKEN_KEY = 'sync-auth-token';
export const SYNC_USER_KEY = 'sync-auth-user';

export const TAB_ID_KEY = 'op-tab-id'; // key en sessionStorage para id de pestaña
export const POST_LOGIN_PREFIX = 'post-login-redirect-'; // usamos post-login-redirect-{tabId} en sessionStorage

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  constructor(private log: LoggerService) { }

  public getOrCreateTabId(): string {
    try {
      let id = window.sessionStorage.getItem(TAB_ID_KEY);
      if (!id) {
        id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        window.sessionStorage.setItem(TAB_ID_KEY, id);
        this.log.info('TokenStorageService: tabId creado', id);
      }
      return id;
    } catch (e) {
      // fallback
      const fallback = `fallback-${Date.now()}`;
      return fallback;
    }
  }

  public getPostLoginKeyForThisTab(): string {
    const tabId = this.getOrCreateTabId();
    return POST_LOGIN_PREFIX + tabId;
  }

  // token-storage.service.ts
  public signOut(): void {
    try {
      // Eliminar sólo token/usuario en sessionStorage (no limpiar todo)
      window.sessionStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.removeItem(USER_KEY);
      // NO hacer sessionStorage.clear() porque destruye TAB_ID_KEY y post-login-redirect-{tabId}

      // Limpiar claves de sincronización global
      localStorage.removeItem(SYNC_TOKEN_KEY);
      localStorage.removeItem(SYNC_USER_KEY);
      localStorage.removeItem('auth-sync');
      localStorage.removeItem('session-active');
      localStorage.removeItem('session-timestamp');
    } catch (e) {
      this.log.error('TokenStorageService.signOut error', e);
    }
  }

  public saveToken(token: string): void {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SYNC_TOKEN_KEY, token);
  }

  public getToken(): string | null {
    const sessionToken = window.sessionStorage.getItem(TOKEN_KEY);
    if (sessionToken) return sessionToken;
    const localToken = localStorage.getItem(SYNC_TOKEN_KEY);
    if (localToken) {
      window.sessionStorage.setItem(TOKEN_KEY, localToken);
      return localToken;
    }
    return null;
  }

  public saveUser(user: any): void {
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(SYNC_USER_KEY, JSON.stringify(user));
  }

  public getUser(): any {
    const sessionUser = window.sessionStorage.getItem(USER_KEY);
    if (sessionUser) return JSON.parse(sessionUser);
    const localUser = localStorage.getItem(SYNC_USER_KEY);
    if (localUser) {
      window.sessionStorage.setItem(USER_KEY, localUser);
      return JSON.parse(localUser);
    }
    return null;
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  public syncFromLocalStorage(): boolean {
    const token = localStorage.getItem(SYNC_TOKEN_KEY);
    const user = localStorage.getItem(SYNC_USER_KEY);

    if (token && user) {
      window.sessionStorage.setItem(TOKEN_KEY, token);
      window.sessionStorage.setItem(USER_KEY, user);
      this.log.info('✅ Token y usuario sincronizados desde localStorage');
      return true;
    }
    return false;
  }
}
