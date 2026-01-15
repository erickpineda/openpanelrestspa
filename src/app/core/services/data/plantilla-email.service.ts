import { Injectable } from '@angular/core';
import { BaseService } from '../../_utils/base.service';
import { Observable } from 'rxjs';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class PlantillaEmailService extends BaseService {
  obtenerPorCodigo(codigo: string): Observable<any> {
    return this.get<any>(OPConstants.Methods.PLANTILLA_EMAIL.OBTENER_POR_CODIGO(codigo));
  }

  actualizarPorCodigo(codigo: string, body: any): Observable<any> {
    return this.put<any>(OPConstants.Methods.PLANTILLA_EMAIL.ACTUALIZAR_POR_CODIGO(codigo), body);
  }

  borrarPorCodigo(codigo: string): Observable<any> {
    return this.delete<any>(OPConstants.Methods.PLANTILLA_EMAIL.BORRAR_POR_CODIGO(codigo));
  }
}

