import { Injectable } from '@angular/core';
import { BaseService } from '../../_utils/base.service';
import { Observable } from 'rxjs';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class AgraviosService extends BaseService {
  obtenerPorPalabra(palabra: string): Observable<any> {
    return this.get<any>(OPConstants.Methods.AGRAVIOS.OBTENER_POR_PALABRA(palabra));
  }
}
