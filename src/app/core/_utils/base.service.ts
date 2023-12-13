import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable()
export abstract class BaseService {

    protected abstract resource: any;
    constructor(protected token: TokenStorageService) {
    }

    protected get path(): string {
        return environment.backend.host + environment.backend.uri + this.resource;;
    }

    protected getPath(resource: string): string {
        return environment.backend.host + environment.backend.uri + resource;;
    }

    protected setHeaders(): HttpHeaders {
        let headers = new HttpHeaders();
        headers = headers.append("Content-Type", "application/json");
        headers = headers.append("Accept", "application/json");
        if (this.token.getToken()) {
            headers = headers.append("Authorization", "Bearer " + this.token.getToken());
        }
        return headers;
    }

}
