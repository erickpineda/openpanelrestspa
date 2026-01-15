import { Injectable } from '@angular/core';
import { BaseService } from '../../_utils/base.service';
import { Observable } from 'rxjs';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class SesionesService extends BaseService {
  obtenerPorHashSesionToken(hash: string): Observable<any> {
    return this.get<any>(OPConstants.Methods.SESIONES.OBTENER_POR_HASH_SESION_TOKEN(hash));
  }
}

