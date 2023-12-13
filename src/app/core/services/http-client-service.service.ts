/* import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable()
export class HttpClientService {

  constructor(private http: HttpClient) {}

  createAuthorizationHeader(headers: HttpHeaders) {
    headers.append('Authorization', 'Bearer ' + ''); 
  }

  get(url: string) {
    let headers = new HttpHeaders();
    this.createAuthorizationHeader(headers);
    return this.http.get(url, {
      headers: headers
    });
  }

  post(url: string, data: any) {
    let headers = new HttpHeaders();
    this.createAuthorizationHeader(headers);
    return this.http.post(url, data, {
      headers: headers
    });
  }
} */