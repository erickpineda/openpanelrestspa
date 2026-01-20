import { Injectable } from '@angular/core';
import { BaseService } from '../../_utils/base.service';
import { Observable } from 'rxjs';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class ExcepcionesService extends BaseService {
  obtenerPorUuid(uuid: string): Observable<any> {
    return this.get<any>(OPConstants.Methods.EXCEPCIONES.OBTENER_POR_UUID(uuid));
  }
}
