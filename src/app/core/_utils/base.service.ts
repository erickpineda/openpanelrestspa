import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenStorageService } from '../services/auth/token-storage.service';
import { environment } from '../../../environments/environment.dev.es';

@Injectable()
export abstract class BaseService {

    protected abstract resource: string;

    constructor(protected token: TokenStorageService) { }

    // Método simplificado para obtener el path de la API
    protected get path(): string {
        return `${environment.backend.host}${environment.backend.uri}${this.resource}`;
    }

    // Método adicional para construir paths dinámicos
    protected buildUrl(endpoint: string): string {
        return `${this.path}${endpoint}`;
    }

    // Método para configurar headers comunes
    protected setHeaders(additionalHeaders?: { [header: string]: string | string[] }): HttpHeaders {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });
        if (this.token.getToken()) {
            headers = headers.append('Authorization', `Bearer ${this.token.getToken()}`);
        }
        if (additionalHeaders) {
            Object.keys(additionalHeaders).forEach(key => {
                headers = headers.append(key, additionalHeaders[key]);
            });
        }
        return headers;
    }

}
