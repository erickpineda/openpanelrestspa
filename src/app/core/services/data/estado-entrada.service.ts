import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../../_utils/base.service';
import { EstadoEntrada } from '../../models/estado-entrada.model';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class EstadoEntradaService extends BaseService {
  protected endpoint = OPConstants.Methods.ESTADOS_ENTRADAS.BASE;

  obtenerPorCodigo(codigo: string): Observable<any> {
    return this.get<any>(OPConstants.Methods.ESTADOS_ENTRADAS.OBTENER_POR_CODIGO(codigo));
  }

  actualizarPorCodigo(codigo: string, entity: EstadoEntrada): Observable<any> {
    return this.put<any>(
      OPConstants.Methods.ESTADOS_ENTRADAS.ACTUALIZAR_POR_CODIGO(codigo),
      entity
    );
  }

  borrarPorCodigo(codigo: string): Observable<any> {
    return this.delete<any>(OPConstants.Methods.ESTADOS_ENTRADAS.BORRAR_POR_CODIGO(codigo));
  }
}
