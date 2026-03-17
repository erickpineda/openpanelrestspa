import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EntradaService } from '@app/core/services/data/entrada.service';

@Injectable({ providedIn: 'root' })
export class EntradaIdRedirectGuard implements CanActivate {
  constructor(private entradaService: EntradaService, private router: Router) {}
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const idParam = route.params['idEntrada'];
    const id = Number(idParam);
    if (!id || Number.isNaN(id)) return true;
    try {
      const resp: any = await firstValueFrom(this.entradaService.obtenerPorId(id));
      const slug = resp?.data?.slug;
      if (slug) {
        return this.router.createUrlTree(['/admin/control/entradas/editar/slug', slug]);
      }
      return true;
    } catch {
      return true;
    }
  }
}
