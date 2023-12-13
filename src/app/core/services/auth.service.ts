import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { TokenStorageService } from './token-storage.service';
const AUTH_API = 'https://vigilant-capybara-pvw759xqrxc7j97-8080.app.github.dev/api/v1/auth/';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json',
  
})
};
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject: BehaviorSubject<Usuario | null>;

  constructor(private http: HttpClient, private tokenStorageService: TokenStorageService) {

    this.userSubject = new BehaviorSubject<Usuario | null>(null);
  }

  public get userValue() {
    return this.userSubject.value;
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(AUTH_API + 'login', { // + 'signin'
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
    return this.http.post(AUTH_API + 'registerUser', {
      username,
      email,
      password
    }, httpOptions);
  }
}
