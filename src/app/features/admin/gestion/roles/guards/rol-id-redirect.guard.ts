import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RolIdRedirectGuard implements CanActivate {
  constructor(private http: HttpClient, private router: Router) {}
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const idParam = route.params['id'];
    const id = Number(idParam);
    if (!id || Number.isNaN(id)) return true;
    try {
      const resp: any = await firstValueFrom(this.http.get(`/roles/obtenerPorId/${id}`));
      const codigo = resp?.data?.codigo;
      if (codigo) {
        const isDelete = state.url.includes('/roles/eliminar/');
        return this.router.createUrlTree([
          '/admin/control/gestion/roles',
          isDelete ? 'eliminar' : 'editar',
          'codigo',
          codigo,
        ]);
      }
      return true;
    } catch {
      return true;
    }
  }
}
