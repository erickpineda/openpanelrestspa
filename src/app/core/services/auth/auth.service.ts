// src/app/core/services/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Usuario } from '../../models/usuario.model';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../../environments/environment.dev.es';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { AuthSyncService } from './auth-sync.service';
import { isJwtExpired } from '../../_utils/jwt.utils';
import { SessionManagerService } from './session-manager.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject: BehaviorSubject<any | null>;
  public user$: Observable<any | null>;

  private urlBase = environment.backend.host;
  private urlUri = environment.backend.uri;
  private urlAuth = OPConstants.Methods.AUTH.BASE;
  private urlLogin = OPConstants.Methods.AUTH.LOGIN;
  private urlRegis = OPConstants.Methods.AUTH.REGISTER_USER;

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService,
    private authSync: AuthSyncService,
    private sessionManager: SessionManagerService
  ) {
    this.userSubject = new BehaviorSubject<any | null>(this.tokenStorage.getUser());
    this.user$ = this.userSubject.asObservable();
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(this.urlBase + this.urlLogin, {
      username,
      password
    }).pipe(
      tap((data: any) => {
        this.tokenStorage.cleanExpiredPostLoginRedirects();
        this.tokenStorage.startPostLoginRedirectMaintenance(60 * 60 * 1000);
        this.tokenStorage.saveToken(data.jwttoken);
        this.tokenStorage.saveUser(data);
        this.userSubject.next(data);
        this.authSync.notifyLogin();
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(
      this.urlBase + this.urlUri + this.urlAuth + OPConstants.Methods.AUTH.LOGOUT,
      {},
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.tokenStorage.getToken()
        })
      }
    ).pipe(
      tap(() => {
        this.performLogout();
      })
    );
  }

  public performLogout(): void {
    this.tokenStorage.cleanExpiredPostLoginRedirects();
    // Delegamos: sessionManager guardará el redirect para esta pestaña y luego borrará tokens
    this.sessionManager.performLogout({ type: 'LOGOUT', message: 'Logout local', allowSave: true, timestamp: Date.now(), originTabId: this.tokenStorage.getOrCreateTabId() });
    // Notificaremos a las otras pestañas
    this.authSync.notifyLogout({ originTabId: this.tokenStorage.getOrCreateTabId() });
    // actualizamos estado local observable
    this.userSubject.next(null);
  }

  // ---------- MÉTODOS NUEVOS (verificación de expiración) ----------

  // Comprueba si el token actual existe y no ha caducado
  public isTokenValid(offsetSeconds = 0): boolean {
    const token = this.tokenStorage.getToken();
    return !!token && !isJwtExpired(token, offsetSeconds);
  }

  // Llamar al iniciar la app para asegurar que no haya token caducado en storage
  public ensureTokenValidOnInit(): void {
    const token = this.tokenStorage.getToken();
    if (!token) return; // no hay sesión
    if (isJwtExpired(token, 0)) {
      this.forceLogoutDueToExpiredToken();
    }
  }

  // Forzar logout local (limpia storage, notifica sync y actualiza estado)
  public forceLogoutDueToExpiredToken(): void {
    try {
      this.tokenStorage.signOut();
      this.userSubject.next(null);
      // Notifica a otras pestañas que se ha hecho logout
      this.authSync.notifyLogout();
      // Disparar evento para que UI reaccione si hace falta
      window.dispatchEvent(new Event('authStateChanged'));
    } finally {
      // Redirigir al login con recarga completa (evita problemas de estado parcial)
      // Ajusta la ruta si tu login no está en '/login'
      window.location.href = '/login';
    }
  }
}
