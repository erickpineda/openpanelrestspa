import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../environments/environment.dev.es';
import { OPConstants } from '../../shared/constants/op-global.constants';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json',
  
})
};
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject: BehaviorSubject<Usuario | null>;
  private urlBase = environment.backend.host;
  private urlLogin = OPConstants.Methods.AUTH.LOGIN;
  private urlRegis = OPConstants.Methods.AUTH.REGISTER_USER;

  constructor(private http: HttpClient, private tokenStorageService: TokenStorageService) {

    this.userSubject = new BehaviorSubject<Usuario | null>(null);
  }

  public get userValue() {
    return this.userSubject.value;
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(this.urlBase + this.urlLogin, { // + 'signin'
      username,
      password
    }, {
    headers: new HttpHeaders(
      {
        'Content-Type': 'application/json',
        //'Authorization': 'Bearer ' + this.tokenStorageService.getToken(),
        'Accept': '*/*',
      })}
    );
  }
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(this.urlBase + this.urlRegis, {
      username,
      email,
      password
    }, httpOptions);
  }
}
