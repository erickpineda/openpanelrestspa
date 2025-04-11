import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs';
import { Entrada } from "../models/entrada.model";
import { TokenStorageService } from "./token-storage.service";
import { CrudService } from "../_utils/crud.service";
import { CambiarEstadoEntradaReq } from "../models/cambiar-estado-entrada.model";
import { RespuestaModelResp } from "../models/respuesta.model";
import { OpenpanelApiResponse } from "../models/openpanel-api-response.model";

@Injectable({
  providedIn: "root"
})
export class EntradaService extends CrudService<Entrada> {

  // Definimos la ruta base para las entradas
  protected override resource = '/entradas';

  constructor(
    protected override http: HttpClient,
    protected override token: TokenStorageService
  ) {
    super(http, token);
  }

  // Método específico para listar tipos de entradas
  listarTiposEntradas(): Observable<OpenpanelApiResponse<any>> {
    const url = this.buildUrl('/tiposEntradas');
    return this.http.get<OpenpanelApiResponse<any>>(url, {
      headers: this.setHeaders()
    });
  }

  // Método específico para listar estados de entradas
  listarEstadosEntradas(): Observable<OpenpanelApiResponse<any>> {
    const url = this.buildUrl('/estadosEntradas');
    return this.http.get<OpenpanelApiResponse<any>>(url, {
      headers: this.setHeaders()
    });
  }

  // Método específico para cambiar el estado de una entrada
  cambiarEstadoEntrada(req: CambiarEstadoEntradaReq): Observable<RespuestaModelResp> {
    const url = this.buildUrl('/cambiarEstadoEntrada');
    return this.http.post<RespuestaModelResp>(url, req, {
      headers: this.setHeaders()
    });
  }

}
