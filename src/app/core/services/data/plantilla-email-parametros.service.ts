import { Injectable } from '@angular/core';
import { BaseService } from '../../_utils/base.service';
import { Observable } from 'rxjs';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class PlantillaEmailParametrosService extends BaseService {
  listarPorIdPlantilla(idPlantillaEmail: number): Observable<any> {
    return this.get<any>(
      OPConstants.Methods.PLANTILLA_EMAIL.PARAMETROS.LISTAR_POR_ID_PLANTILLA(idPlantillaEmail)
    );
  }

  obtenerPorClave(clave: string): Observable<any> {
    return this.get<any>(OPConstants.Methods.PLANTILLA_EMAIL.PARAMETROS.OBTENER_POR_CLAVE(clave));
  }

  obtenerPorValor(valor: string): Observable<any> {
    return this.get<any>(OPConstants.Methods.PLANTILLA_EMAIL.PARAMETROS.OBTENER_POR_VALOR(valor));
  }
}
