// src/app/core/services/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, switchMap, tap } from 'rxjs';
import { Usuario } from '../../models/usuario.model';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../../environments/environment.dev.es';
import { OPConstants } from '../../../shared/constants/op-global.constants';
import { AuthSyncService } from './auth-sync.service';
import { isJwtExpired } from '../../_utils/jwt.utils';
import { SessionManagerService } from './session-manager.service';
import { MeResponse } from './me.types';
import { OpenpanelApiResponse } from '../../models/openpanel-api-response.model';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
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

  /**
   * Carga información del usuario autenticado (roles + privilegios).
   * Nota: el backend expone este endpoint en /api/v1/me.
   */
  public loadMe(): Observable<MeResponse> {
    return this.http
      .get<OpenpanelApiResponse<MeResponse>>(this.urlBase + this.urlUri + '/me', {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.tokenStorage.getToken(),
      }),
      })
      .pipe(
        map((res) => res?.data as MeResponse)
      );
  }

  login(username: string, password: string): Observable<any> {
    return this.http
      .post(this.urlBase + this.urlUri + this.urlAuth + this.urlLogin, {
        username,
        password,
      })
      .pipe(
        switchMap((response: any) => {
          const data = response?.data ?? response;
          this.tokenStorage.cleanExpiredPostLoginRedirects();
          this.tokenStorage.startPostLoginRedirectMaintenance(60 * 60 * 1000);
          this.tokenStorage.saveToken(data.jwttoken);

          // Guardamos el payload base (compat)
          this.tokenStorage.saveUser(data);
          this.userSubject.next(data);

          return this.loadMe().pipe(
            map((me) => {
              const merged = {
                ...data,
                roles: Array.isArray(me?.roles) ? me.roles : data.roles,
                privileges: Array.isArray(me?.privileges) ? me.privileges : [],
              };
              // Guardamos el usuario con privilegios para guards/menús
              this.tokenStorage.saveUser(merged);
              this.userSubject.next(merged);
              return merged;
            })
          );
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post(this.urlBase + this.urlUri + this.urlRegis, userData, httpOptions);
  }

  logout(): Observable<any> {
    return this.http
      .post(
        this.urlBase + this.urlUri + this.urlAuth + OPConstants.Methods.AUTH.LOGOUT,
        {},
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.tokenStorage.getToken(),
          }),
        }
      )
      .pipe(
        tap(() => {
          this.performLogout();
        })
      );
  }

  public performLogout(): void {
    this.tokenStorage.cleanExpiredPostLoginRedirects();
    // Delegamos: sessionManager guardará el redirect para esta pestaña y luego borrará tokens
    this.sessionManager.performLogout({
      type: 'LOGOUT',
      message: 'Logout local',
      allowSave: true,
      timestamp: Date.now(),
      originTabId: this.tokenStorage.getOrCreateTabId(),
      isManual: true,
    });
    // Notificaremos a las otras pestañas
    this.authSync.notifyLogout({
      originTabId: this.tokenStorage.getOrCreateTabId(),
      isManual: true,
    });
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

  // Verificar estado de la sesión con backend (detecta sesiones huérfanas)
  public validateSessionStatus(): Observable<any> {
    return this.http
      .get<OpenpanelApiResponse<any>>(this.urlBase + this.urlUri + '/auth/session-status', {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.tokenStorage.getToken(),
        }),
      })
      .pipe(
        map((res) => res?.data)
      );
  }

  // Forzar logout local (limpia storage, notifica sync y actualiza estado)
  public forceLogoutDueToExpiredToken(): void {
    // En vez de redirigir de inmediato, emitimos evento de expiración
    // para permitir que pantallas críticas (crear entrada) guarden trabajo temporal.
    try {
      this.sessionManager.notifySessionExpired();
    } catch {}
  }
}
