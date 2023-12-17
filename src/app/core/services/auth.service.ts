import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { TokenStorageService } from './token-storage.service';
import { BaseService } from '../_utils/base.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {
  private userSubject: BehaviorSubject<Usuario | null>;

  protected resource = '/auth';

  constructor(private http: HttpClient, private tokenStorageService: TokenStorageService) {

    super(tokenStorageService);
    this.userSubject = new BehaviorSubject<Usuario | null>(null);
  }

  public get userValue() {
    return this.userSubject.value;
  }

  login(username: string, password: string): Observable<any> {
    const url = `${this.path}/login`;
    return this.http.post(url, { // + 'signin'
      username,
      password
    }, {
      headers: this.setHeaders()
    });
  }
  register(username: string, email: string, password: string): Observable<any> {
    const url = `${this.path}/registerUser`;
    return this.http.post(url, {
      username,
      email,
      password
    }, {
      headers: this.setHeaders()
    });
  }
}
