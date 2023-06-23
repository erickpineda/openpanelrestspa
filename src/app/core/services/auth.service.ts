import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
const AUTH_API = 'http://localhost:8080/api/v1/auth';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject: BehaviorSubject<Usuario | null>;

  constructor(private http: HttpClient) {

    this.userSubject = new BehaviorSubject<Usuario | null>(null);
  }

  public get userValue() {
    return this.userSubject.value;
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(AUTH_API, { // + 'signin'
      username,
      password
    }, httpOptions);
  }
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(AUTH_API + 'signup', {
      username,
      email,
      password
    }, httpOptions);
  }
}
