import { Injectable } from '@angular/core';
import { BaseService } from '../../_utils/base.service';
import { Observable } from 'rxjs';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class LiteralesService extends BaseService {
  obtenerPorCodigoLiteral(codigoLiteral: string): Observable<any> {
    return this.get<any>(OPConstants.Methods.LITERALES.OBTENER_POR_CODIGO_LITERAL(codigoLiteral));
  }

  obtenerPorCodigoPropiedad(codigoPropiedad: string): Observable<any> {
    return this.get<any>(
      OPConstants.Methods.LITERALES.OBTENER_POR_CODIGO_PROPIEDAD(codigoPropiedad)
    );
  }
}

