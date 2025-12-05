import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { CrudService } from '../../_utils/crud.service';
import { Ajustes } from '../../models/ajustes.model';
import { HttpClient } from '@angular/common/http';
import { TokenStorageService } from '../auth/token-storage.service';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';

@Injectable({ providedIn: 'root' })
export class AjustesService extends CrudService<Ajustes, number> {
  protected endpoint = '/config/ajustes';

  constructor(
    protected override http: HttpClient,
    protected override tokenStorageService: TokenStorageService
  ) {
    super(http, tokenStorageService);
  }

  listarAjustesSafe(): Observable<Ajustes[]> {
    const context = new HttpContext();
    return this.safeGetList<Ajustes>(
      this.endpoint,
      undefined,
      undefined,
      'config.ajustes.listar',
      context
    );
  }

  listarAjustesSafeSinGlobalLoader(): Observable<Ajustes[]> {
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.safeGetList<Ajustes>(
      this.endpoint,
      undefined,
      undefined,
      'config.ajustes.listar',
      context
    );
  }
}
