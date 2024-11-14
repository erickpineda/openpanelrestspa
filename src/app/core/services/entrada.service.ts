import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs';
import { Entrada } from "../models/entrada.model";
import { TokenStorageService } from "./token-storage.service";
import { CrudService } from "../_utils/crud.service";
import { CambiarEstadoEntradaReq } from "../models/cambiar-estado-entrada.model";
import { RespuestaModelResp } from "../models/respuesta.model";
import { TipoEntradaResponse } from "../models/tipo-entrada-response.model";
import { EstadoEntradaResponse } from "../models/estado-entrada-response.model";

@Injectable({
  providedIn: "root"
})
export class EntradaService extends CrudService<Entrada> {
  protected resource = '/entradas';

  constructor(
    protected override http: HttpClient,
    protected override token: TokenStorageService) {
    super(http, token);
  }

  listarTiposEntradas(): Observable<TipoEntradaResponse> {
    const url = `${this.path}/tiposEntradas`;
    return this.http.get<TipoEntradaResponse>(url, {
      observe: 'body', headers: this.setHeaders(),
    });
  }

  listarEstadosEntradas(): Observable<EstadoEntradaResponse> {
    const url = `${this.path}/estadosEntradas`;
    return this.http.get<EstadoEntradaResponse>(url, {
      observe: 'body', headers: this.setHeaders(),
    });
  }

  cambiarEstadoEntrada(req: CambiarEstadoEntradaReq): Observable<RespuestaModelResp> {
    const url = `${this.path}/cambiarEstadoEntrada`;
    return this.http.post<RespuestaModelResp>(url, req, { headers: this.setHeaders() });
  }

}