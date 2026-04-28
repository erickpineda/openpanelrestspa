// src/app/core/services/auth/token-storage.service.ts
import { Injectable } from '@angular/core';
import { LoggerService } from '../logger.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { UserRole } from '../../../shared/types/navigation.types';

export const TOKEN_KEY = OPConstants.Session.TOKEN_KEY;
export const USER_KEY = OPConstants.Session.USER_KEY;
export const SYNC_TOKEN_KEY = OPConstants.Session.SYNC_TOKEN_KEY;
export const SYNC_USER_KEY = OPConstants.Session.SYNC_USER_KEY;

export const TAB_ID_KEY = OPConstants.Session.TAB_ID_KEY; // key en sessionStorage para id de pestaña
export const POST_LOGIN_PREFIX = OPConstants.Session.POST_LOGIN_PREFIX; // usamos post-login-redirect-{tabId} en sessionStorage
export const POST_LOGIN_REDIRECT = OPConstants.Session.POST_LOGIN_REDIRECT;

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  constructor(private log: LoggerService) {}

  private readonly POST_LOGIN_TTL_MS =
    (OPConstants.Session.POST_LOGIN_MAX_AGE_DAYS || 1) * 24 * 60 * 60 * 1000;
  private postLoginMaintenanceTimer: any = null;

  private readonly roleWeights: Record<UserRole, number> = {
    [UserRole.PROPIETARIO]: 7,
    [UserRole.ADMINISTRADOR]: 6,
    [UserRole.MANTENIMIENTO]: 5,
    [UserRole.DESARROLLADOR]: 4,
    [UserRole.EDITOR]: 3,
    [UserRole.AUTOR]: 2,
    [UserRole.LECTOR]: 1,
    [UserRole.ANONYMOUS]: 0,
  };

  private normalizeRoleCandidate(candidate: string): string {
    const v = (candidate || '').trim().toUpperCase();
    return v.startsWith('ROLE_') ? v.substring('ROLE_'.length) : v;
  }

  private mapCandidateToUserRole(candidate: string): UserRole | null {
    const normalized = this.normalizeRoleCandidate(candidate);
    if (!normalized) return null;

    const aliasMap: Record<string, UserRole> = {
      USER: UserRole.LECTOR,
      USUARIO: UserRole.LECTOR,
      MODERATOR: UserRole.EDITOR,
      MODERADOR: UserRole.EDITOR,
      OWNER: UserRole.PROPIETARIO,
      SUPERADMIN: UserRole.PROPIETARIO,
      SUPER_ADMIN: UserRole.PROPIETARIO,
      DEV: UserRole.DESARROLLADOR,
      DEVELOPER: UserRole.DESARROLLADOR,
      MAINTENANCE: UserRole.MANTENIMIENTO,
    };

    const alias = aliasMap[normalized];
    if (alias) return alias;

    const roleValues = Object.values(UserRole) as UserRole[];
    if (roleValues.includes(normalized as UserRole)) {
      return normalized as UserRole;
    }

    const key = normalized as keyof typeof UserRole;
    if (UserRole[key]) {
      return UserRole[key];
    }

    return null;
  }

  private pickHighestRole(roles: UserRole[]): UserRole {
    if (!roles || roles.length === 0) return UserRole.LECTOR;
    return roles.reduce((best, current) => {
      const bestWeight = this.roleWeights[best] ?? 0;
      const currentWeight = this.roleWeights[current] ?? 0;
      return currentWeight > bestWeight ? current : best;
    }, roles[0]);
  }

  public parseUserRole(candidate: string): UserRole | null {
    return this.mapCandidateToUserRole(candidate);
  }

  public getUserRoles(): UserRole[] {
    const user = this.getUser();
    if (!user) return [];

    const mapped: UserRole[] = [];

    if (user.rolCodigo) {
      const fromCodigo = this.mapCandidateToUserRole(user.rolCodigo);
      if (fromCodigo) mapped.push(fromCodigo);
    }

    if (user.roles && Array.isArray(user.roles)) {
      for (const r of user.roles) {
        const mappedRole = this.mapCandidateToUserRole(r);
        if (mappedRole) mapped.push(mappedRole);
      }
    }

    if (mapped.length === 0) return [UserRole.LECTOR];

    return Array.from(new Set(mapped));
  }

  public hasAnyRole(required: Array<UserRole | string> | null | undefined): boolean {
    if (!required || required.length === 0) return true;

    const requiredMapped = required
      .map((r) => (typeof r === 'string' ? this.mapCandidateToUserRole(r) : r))
      .filter((r): r is UserRole => !!r);

    if (requiredMapped.length === 0) return false;

    const userRoles = this.getUserRoles();
    if (userRoles.length === 0) return false;

    return requiredMapped.some((r) => userRoles.includes(r));
  }

  public hasMinimumRole(minRole: UserRole): boolean {
    const current = this.getUserRole();
    const currentWeight = this.roleWeights[current] ?? 0;
    const minWeight = this.roleWeights[minRole] ?? 0;
    return currentWeight >= minWeight;
  }

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

  public savePostLoginRedirectBase(value: string): void {
    try {
      localStorage.setItem(POST_LOGIN_REDIRECT, `${value}|${new Date().toISOString()}`);
    } catch {}
  }

  public getPostLoginRedirectBase(): string | null {
    try {
      const raw = localStorage.getItem(POST_LOGIN_REDIRECT);
      if (!raw) return null;
      const [val, iso] = raw.split('|');
      const ts = Date.parse(iso || '');
      if (isNaN(ts)) return val || null;
      const age = Date.now() - ts;
      if (age > this.POST_LOGIN_TTL_MS) {
        localStorage.removeItem(POST_LOGIN_REDIRECT);
        return null;
      }
      return val || null;
    } catch {
      return null;
    }
  }

  public removePostLoginRedirectBase(): void {
    try {
      localStorage.removeItem(POST_LOGIN_REDIRECT);
    } catch {}
  }

  public savePostLoginRedirectForTab(value: string): void {
    const key = this.getPostLoginKeyForThisTab();
    try {
      window.sessionStorage.setItem(key, `${value}|${new Date().toISOString()}`);
    } catch {}
  }

  public getPostLoginRedirectForTab(): string | null {
    const key = this.getPostLoginKeyForThisTab();
    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) return null;
      const [val, iso] = raw.split('|');
      const ts = Date.parse(iso || '');
      if (isNaN(ts)) return val || null;
      const age = Date.now() - ts;
      if (age > this.POST_LOGIN_TTL_MS) {
        window.sessionStorage.removeItem(key);
        return null;
      }
      return val || null;
    } catch {
      return null;
    }
  }

  public removePostLoginRedirectForTab(): void {
    const key = this.getPostLoginKeyForThisTab();
    try {
      window.sessionStorage.removeItem(key);
    } catch {}
  }

  public cleanExpiredPostLoginRedirects(): void {
    try {
      const raw = localStorage.getItem(POST_LOGIN_REDIRECT);
      if (raw) {
        const iso = raw.split('|')[1] || '';
        const ts = Date.parse(iso);
        if (!isNaN(ts) && Date.now() - ts > this.POST_LOGIN_TTL_MS) {
          localStorage.removeItem(POST_LOGIN_REDIRECT);
        }
      }
    } catch {}
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.indexOf(POST_LOGIN_PREFIX) === 0) keys.push(k);
      }

      keys.forEach((k) => {
        const raw = window.sessionStorage.getItem(k) || '';
        const iso = raw.split('|')[1] || '';
        const ts = Date.parse(iso);
        if (!isNaN(ts) && Date.now() - ts > this.POST_LOGIN_TTL_MS) {
          window.sessionStorage.removeItem(k);
        }
      });
    } catch {}
    try {
      const localKeys: { key: string; ts: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(POST_LOGIN_PREFIX) === 0) {
          const rest = k.substring(POST_LOGIN_PREFIX.length);
          const tsStr = rest.split('-')[0] || '';
          const tsNum = Number(tsStr);
          localKeys.push({ key: k, ts: isNaN(tsNum) ? 0 : tsNum });
        }
      }
      const now = Date.now();
      localKeys.forEach(({ key, ts }) => {
        if (ts > 0 && now - ts > this.POST_LOGIN_TTL_MS) {
          localStorage.removeItem(key);
        }
      });
      const max = OPConstants.Session.POST_LOGIN_MAX_ENTRIES || 50;
      if (localKeys.length > max) {
        const sorted = localKeys.sort((a, b) => b.ts - a.ts);
        const toDelete = sorted.slice(max);
        toDelete.forEach(({ key }) => {
          localStorage.removeItem(key);
        });
      }
    } catch {}
  }

  public startPostLoginRedirectMaintenance(intervalMs = 15 * 60 * 1000): void {
    if (this.postLoginMaintenanceTimer) return;
    this.postLoginMaintenanceTimer = setInterval(
      () => this.cleanExpiredPostLoginRedirects(),
      intervalMs
    );
  }

  public stopPostLoginRedirectMaintenance(): void {
    if (this.postLoginMaintenanceTimer) {
      clearInterval(this.postLoginMaintenanceTimer);
      this.postLoginMaintenanceTimer = null;
    }
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
      localStorage.removeItem(OPConstants.Session.AUTH_SYNC_KEY);
      localStorage.removeItem(OPConstants.Session.SESSION_ACTIVE_KEY);
      localStorage.removeItem(OPConstants.Session.SESSION_TIMESTAMP_KEY);

      // Limpiar historial público y preferencias de lectura
      const historyPrefix = 'public-history:';
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(historyPrefix)) {
          localStorage.removeItem(key);
        }
      }
      localStorage.removeItem('public-reader-prefs');

      // Limpiar estado de UI (sidebar)
      localStorage.removeItem('sidebar_expanded_items');
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

  /**
   * Obtiene el rol del usuario actual basado en los datos almacenados.
   * Realiza el mapeo dinámico de roles de Spring Security (ROLE_X) a UserRole.
   */
  public getUserRole(): UserRole {
    const user = this.getUser();

    // Si no hay usuario, retornamos ANONYMOUS o LECTOR según política (aquí LECTOR por defecto seguro)
    if (!user) {
      return UserRole.LECTOR;
    }

    const mapped: UserRole[] = [];

    if (user.rolCodigo) {
      const fromCodigo = this.mapCandidateToUserRole(user.rolCodigo);
      if (fromCodigo) mapped.push(fromCodigo);
    }

    if (user.roles && Array.isArray(user.roles)) {
      for (const r of user.roles) {
        const mappedRole = this.mapCandidateToUserRole(r);
        if (mappedRole) mapped.push(mappedRole);
      }
    }

    if (mapped.length > 0) {
      return this.pickHighestRole(mapped);
    }

    return UserRole.LECTOR;
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
