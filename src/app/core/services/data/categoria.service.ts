// core/services/data/categoria.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Categoria } from '../../models/categoria.model';
import { CrudService } from '../../_utils/crud.service';
import { HttpContext } from '@angular/common/http';
import { NetworkInterceptor } from '../../interceptor/network.interceptor';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService extends CrudService<Categoria, number> {
  protected endpoint = '/categorias';

  listarSinGlobalLoader(): Observable<Categoria[]> {
    const context = new HttpContext().set(NetworkInterceptor.SKIP_GLOBAL_LOADER, true);
    return this.safeGetList<Categoria>(this.endpoint, undefined, undefined, 'categorias.listar', context);
  }

}