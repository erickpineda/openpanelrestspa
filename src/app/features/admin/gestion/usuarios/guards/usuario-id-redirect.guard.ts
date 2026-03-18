import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsuarioService } from '@app/core/services/data/usuario.service';
import { OpenpanelApiResponse } from '@app/core/models/openpanel-api-response.model';
import { Usuario } from '@app/core/models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioIdRedirectGuard implements CanActivate {
  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}
  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    const idParam = route.params['id'];
    const id = Number(idParam);
    if (!id || Number.isNaN(id)) return true;
    try {
      const resp: OpenpanelApiResponse<Usuario> = await firstValueFrom(
        this.usuarioService.obtenerPorId(id)
      );
      const username = (resp?.data as any)?.username;
      if (username) {
        return this.router.createUrlTree([
          '/admin/control/gestion/usuarios/editar/username',
          username,
        ]);
      }
      return true;
    } catch {
      return true;
    }
  }
}
