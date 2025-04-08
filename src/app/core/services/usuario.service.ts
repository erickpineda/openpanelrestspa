import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Usuario } from "../models/usuario.model";
import { CrudService } from "../_utils/crud.service";
import { TokenStorageService } from "./token-storage.service";
import { catchError, Observable } from "rxjs";
import { PerfilResponse } from "../models/perfil-response.model";
import { OpenpanelApiResponse } from "../models/openpanel-api-response.model";

@Injectable({
  providedIn: "root"
})
export class UsuarioService extends CrudService<Usuario> {
  protected resource = '/usuarios';

  constructor(
    protected override http: HttpClient,
    protected override token: TokenStorageService) {
    super(http, token);
  }

  obtenerDatosSesionActual(): Observable<OpenpanelApiResponse<any>> {
    const url = `${this.path}/perfil/yo`;
    return this.http.get<OpenpanelApiResponse<PerfilResponse>>(url, {
      observe: 'body', headers: this.setHeaders(),
    }).pipe(catchError(this.handleError));;
  }

  private obtenerDatosUsuarioActual(): Promise<PerfilResponse> {
      return new Promise((resolve, reject) => {
        this.obtenerDatosSesionActual().subscribe({
          next: (response: OpenpanelApiResponse<any>) => {
            const usuario: PerfilResponse = (response.data) ? response.data : PerfilResponse;
            resolve(usuario);
          },
          error: err => {
            reject(err);
          }
        });
      })
    }

  async getUsernameActual(): Promise<string | void> {
    try {
      const perfil = await this.obtenerDatosUsuarioActual();
      if (perfil) {
        return perfil.username;
      } else {
        console.log('No se ha podido cargar el perfil actual');
      }
    } catch (err) {
      console.log('Ha habido algun problema para recuperar el usuario en sesion');
    }
  }

}
