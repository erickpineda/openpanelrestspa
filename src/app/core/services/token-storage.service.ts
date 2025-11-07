// token-storage.service.ts
import { Injectable } from '@angular/core';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';
const SYNC_TOKEN_KEY = 'sync-auth-token'; // Para sincronización entre pestañas
const SYNC_USER_KEY = 'sync-auth-user';   // Para sincronización entre pestañas

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  constructor() { }

  signOut(): void {
    // Limpiar sessionStorage
    window.sessionStorage.clear();
    // Limpiar localStorage para sincronización
    localStorage.removeItem(SYNC_TOKEN_KEY);
    localStorage.removeItem(SYNC_USER_KEY);
    localStorage.removeItem('auth-sync');
    localStorage.removeItem('session-active');
    localStorage.removeItem('session-timestamp');
  }

  public saveToken(token: string): void {
    // Guardar en sessionStorage (comportamiento original)
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
    
    // ✅ NUEVO: Guardar también en localStorage para sincronización
    localStorage.setItem(SYNC_TOKEN_KEY, token);
  }

  public getToken(): string | null {
    // Primero intentar con sessionStorage
    const sessionToken = window.sessionStorage.getItem(TOKEN_KEY);
    if (sessionToken) {
      return sessionToken;
    }
    
    // ✅ NUEVO: Si no hay en sessionStorage, buscar en localStorage
    const localToken = localStorage.getItem(SYNC_TOKEN_KEY);
    if (localToken) {
      // Sincronizar a sessionStorage
      window.sessionStorage.setItem(TOKEN_KEY, localToken);
      return localToken;
    }
    
    return null;
  }

  public saveUser(user: any): void {
    // Guardar en sessionStorage
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    
    // ✅ NUEVO: Guardar también en localStorage para sincronización
    localStorage.setItem(SYNC_USER_KEY, JSON.stringify(user));
  }

  public getUser(): any {
    // Primero intentar con sessionStorage
    const sessionUser = window.sessionStorage.getItem(USER_KEY);
    if (sessionUser) {
      return JSON.parse(sessionUser);
    }
    
    // ✅ NUEVO: Si no hay en sessionStorage, buscar en localStorage
    const localUser = localStorage.getItem(SYNC_USER_KEY);
    if (localUser) {
      // Sincronizar a sessionStorage
      window.sessionStorage.setItem(USER_KEY, localUser);
      return JSON.parse(localUser);
    }
    
    return null;
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ✅ NUEVO: Método para sincronizar desde localStorage
  public syncFromLocalStorage(): boolean {
    const token = localStorage.getItem(SYNC_TOKEN_KEY);
    const user = localStorage.getItem(SYNC_USER_KEY);
    
    if (token && user) {
      window.sessionStorage.setItem(TOKEN_KEY, token);
      window.sessionStorage.setItem(USER_KEY, user);
      console.log('✅ Token y usuario sincronizados desde localStorage');
      return true;
    }
    
    return false;
  }
}