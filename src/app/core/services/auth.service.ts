import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { TokenStorageService } from './token-storage.service';
import { environment } from 'src/environments/environment';

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
    return this.http.post(environment.backend.host + 'login', { // + 'signin'
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
    return this.http.post(environment.backend.host + 'registerUser', {
      username,
      email,
      password
    }, httpOptions);
  }
}
