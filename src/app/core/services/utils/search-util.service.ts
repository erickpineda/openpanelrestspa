import { Injectable } from '@angular/core';
import { SearchOperation, getSimpleOperation, getDataOption } from '../../_utils/search-operation.util';

@Injectable({
  providedIn: 'root'
})
export class SearchUtilService {
  getOperation(input: string): SearchOperation | null {
    return getSimpleOperation(input);
  }

  getOption(input: string): SearchOperation | null {
    return getDataOption(input);
  }

  getOperacionesDisponibles(): { nombre: string; valor: string }[] {
    return [
      { nombre: 'Contiene', valor: SearchOperation.CONTAINS },
      { nombre: 'Igual a', valor: SearchOperation.EQUAL },
      { nombre: 'No contiene', valor: SearchOperation.DOES_NOT_CONTAIN },
      { nombre: 'Mayor que', valor: SearchOperation.GREATER_THAN },
      { nombre: 'Menor que', valor: SearchOperation.LESS_THAN },
      { nombre: 'Es nulo', valor: SearchOperation.NUL },
      { nombre: 'No es nulo', valor: SearchOperation.NOT_NULL }
    ];
  }

  buildRequest(entityName: string | null, criteria: { filterKey: string; value: any; operation: string }[], dataOption: string): any {
    const list = (criteria || []).map(c => ({
      filterKey: c.filterKey,
      value: c.value != null ? String(c.value) : '',
      operation: c.operation,
      clazzName: entityName || undefined,
      dataOption: dataOption
    }));
    return { dataOption, searchCriteriaList: list };
  }

  buildSingle(entityName: string | null, filterKey: string, value: any, operation: string, dataOption: string = 'AND'): any {
    return this.buildRequest(entityName, [{ filterKey, value, operation }], dataOption);
  }
}
