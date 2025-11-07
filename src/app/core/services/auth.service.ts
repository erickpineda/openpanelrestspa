import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../environments/environment.dev.es';
import { OPConstants } from '../../shared/constants/op-global.constants';
import { AuthSyncService } from './auth-sync.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json',
  
})
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
    private authSync: AuthSyncService
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
        this.tokenStorage.saveToken(data.jwttoken);
        this.tokenStorage.saveUser(data);
        this.userSubject.next(data);
        this.authSync.notifyLogin();
        //this.authSync.setSessionActive(); // ✅ NUEVO: Marcar sesión como activa
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
    this.tokenStorage.signOut();
    this.userSubject.next(null);
    this.authSync.notifyLogout();
    //this.authSync.setSessionInactive(); // ✅ NUEVO: Marcar sesión como inactiva
  }
}
