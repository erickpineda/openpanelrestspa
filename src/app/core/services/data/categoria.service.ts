// core/services/data/categoria.service.ts
import { Injectable } from '@angular/core';
import { Categoria } from '../../models/categoria.model';
import { CrudService } from '../../_utils/crud.service';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService extends CrudService<Categoria, number> {
  protected endpoint = '/categorias';

}