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
  protected override resource = '/usuarios';

  constructor(
    protected override http: HttpClient,
    protected override token: TokenStorageService) {
    super(http, token);
  }

  // Método para obtener los datos de la sesión actual
  obtenerDatosSesionActual(): Observable<OpenpanelApiResponse<any>> {
    return this.http.get<OpenpanelApiResponse<PerfilResponse>>(this.buildUrl('/perfil/yo'), {
      headers: this.setHeaders(),
    });
  }

  // Método privado para obtener los datos del usuario actual
  private obtenerDatosUsuarioActual(): Promise<PerfilResponse> {
      return new Promise((resolve, reject) => {
        this.obtenerDatosSesionActual().subscribe({
          next: (response: OpenpanelApiResponse<any>) => {
            const usuario = response.data as PerfilResponse;
            resolve(usuario);
          },
          error: err => {
            reject(err);
          }
        });
      });
  }

  // Método asíncrono para obtener el nombre de usuario actual
  async getUsernameActual(): Promise<string | void> {
    try {
      const perfil = await this.obtenerDatosUsuarioActual();
      return perfil?.username || 'No se ha podido cargar el perfil actual';
    } catch (err) {
      console.error('Ha habido algun problema para recuperar el usuario en sesión', err);
    }
  }

}
