import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { CrudService } from '../../_utils/crud.service';
import { Tema } from '../../models/tema.model';
import { HttpClient } from '@angular/common/http';
import { TokenStorageService } from '../auth/token-storage.service';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';

@Injectable({ providedIn: 'root' })
export class TemasService extends CrudService<Tema, number> {
  protected endpoint = '/config/temas';

  constructor(
    protected override http: HttpClient,
    protected override tokenStorageService: TokenStorageService
  ) {
    super(http, tokenStorageService);
  }

  listarTemasSafe(): Observable<Tema[]> {
    const context = new HttpContext();
    return this.safeGetList<Tema>(
      this.endpoint,
      undefined,
      undefined,
      'config.temas.listar',
      context
    );
  }

  listarTemasSafeSinGlobalLoader(): Observable<Tema[]> {
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.safeGetList<Tema>(
      this.endpoint,
      undefined,
      undefined,
      'config.temas.listar',
      context
    );
  }
}
