import { Injectable } from '@angular/core';
import {
  SearchOperation,
  getSimpleOperation,
  getDataOption,
} from '../../_utils/search-operation.util';
import {
  SearchConditionNode,
  SearchConditionOp,
  SearchGroupNode,
  SearchGroupOp,
  SearchNode,
  SearchQuery,
} from '@app/shared/models/search.models';
import {
  serializeDateInputToBackend,
  serializeDateTimeLocalInputToBackend,
} from '@app/shared/utils/date-utils';

@Injectable({
  providedIn: 'root',
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
      { nombre: 'No es nulo', valor: SearchOperation.NOT_NULL },
    ];
  }

  buildRequest(
    entityName: string | null,
    criteria: { filterKey: string; value: any; operation: string }[],
    dataOption: string
  ): SearchQuery {
    // `entityName` se conserva por compatibilidad de llamadas existentes,
    // pero ya no se envía al backend (el endpoint define el contexto).
    const groupOp = this.normalizeGroupOp(dataOption);
    const children = (criteria || [])
      .map((c) => this.buildCondition(c.filterKey, c.operation, c.value))
      .filter((n): n is SearchConditionNode => n != null);

    if (children.length === 1) {
      return { node: children[0] };
    }
    return { node: this.buildGroup(groupOp, children.length ? children : [this.emptyCondition()]) };
  }

  buildSingle(
    entityName: string | null,
    filterKey: string,
    value: any,
    operation: string,
    dataOption: string = 'AND'
  ): SearchQuery {
    return this.buildRequest(entityName, [{ filterKey, value, operation }], dataOption);
  }

  buildGroup(op: SearchGroupOp, children: SearchNode[]): SearchGroupNode {
    return { type: 'group', op, children };
  }

  buildCondition(field: string, op: string, value: any): SearchConditionNode | null {
    const cleanField = String(field ?? '').trim();
    const cleanOp = String(op ?? '').trim();
    if (!cleanField || !cleanOp) return null;

    const normalizedOp = this.normalizeConditionOp(cleanOp);
    // `null` / `not_null` no llevan value.
    if (normalizedOp === 'null' || normalizedOp === 'not_null') {
      return { type: 'condition', field: cleanField, op: normalizedOp };
    }

    // Si viene un Date, serializar al formato público (Madrid).
    // Si viene string de inputs nativos, permitir auto-transform:
    // - yyyy-MM-dd (input date) => dd-MM-yyyy
    // - yyyy-MM-ddTHH:mm (datetime-local) => dd-MM-yyyy HH:mm:ss
    const serializedValue = this.serializeDateLikeValue(value);
    return {
      type: 'condition',
      field: cleanField,
      op: normalizedOp,
      value: serializedValue,
    };
  }

  normalizeGroupOp(input: string | null | undefined): SearchGroupOp {
    const s = String(input ?? '').trim().toUpperCase();
    if (s === 'OR' || s === 'ANY') return 'OR';
    // DEFAULT: AND
    return 'AND';
  }

  normalizeConditionOp(op: string): SearchConditionOp {
    // El repo todavía tiene algunos usages con tokens legacy en mayúsculas o abreviados.
    // El backend del nuevo contrato espera minúsculas (contains, equal, ...).
    const s = String(op ?? '').trim();
    const lower = s.toLowerCase();
    const map: Record<string, SearchConditionOp> = {
      // legacy mayúsculas
      contains: 'contains',
      equal: 'equal',
      not_equal: 'not_equal',
      begins_with: 'begins_with',
      ends_with: 'ends_with',
      does_not_contain: 'does_not_contain',
      does_not_begin_with: 'does_not_begin_with',
      does_not_end_with: 'does_not_end_with',
      null: 'null',
      not_null: 'not_null',
      greater_than: 'greater_than',
      greater_than_equal: 'greater_than_equal',
      less_than: 'less_than',
      less_than_equal: 'less_than_equal',
      boolean: 'boolean',

      CONTAINS: 'contains',
      EQUAL: 'equal',
      NOT_EQUAL: 'not_equal',
      BEGINS_WITH: 'begins_with',
      ENDS_WITH: 'ends_with',
      DOES_NOT_CONTAIN: 'does_not_contain',
      DOES_NOT_BEGIN_WITH: 'does_not_begin_with',
      DOES_NOT_END_WITH: 'does_not_end_with',
      NULL: 'null',
      NOT_NULL: 'not_null',
      GREATER_THAN: 'greater_than',
      GREATER_THAN_EQUAL: 'greater_than_equal',
      LESS_THAN: 'less_than',
      LESS_THAN_EQUAL: 'less_than_equal',
      BOOLEAN: 'boolean',

      // abreviados históricos
      cn: 'contains',
      eq: 'equal',
      ne: 'not_equal',
      bw: 'begins_with',
      ew: 'ends_with',
      nc: 'does_not_contain',
      bn: 'does_not_begin_with',
      en: 'does_not_end_with',
      nu: 'null',
      nn: 'not_null',
      gt: 'greater_than',
      ge: 'greater_than_equal',
      lt: 'less_than',
      le: 'less_than_equal',
    };
    return map[s] || map[lower] || (lower as any);
  }

  private emptyCondition(): SearchConditionNode {
    return { type: 'condition', field: '', op: 'contains', value: '' };
  }

  private serializeDateLikeValue(value: any): any {
    if (value == null) return value;

    // Soporte directo a strings de input date/datetime-local.
    if (typeof value === 'string') {
      const s = value.trim();
      const asDate = serializeDateInputToBackend(s);
      if (asDate) return asDate;
      const asDateTime = serializeDateTimeLocalInputToBackend(s);
      if (asDateTime) return asDateTime;
      return value;
    }

    // Si llega Date, intentar formatear con Intl Europe/Madrid (a través de date-utils)
    // pero sin añadir dependencia circular fuerte; si se requiere, que el caller pase string ya serializado.
    if (value instanceof Date) {
      const dt = serializeDateTimeLocalInputToBackend(
        // Convertimos a datetime-local "YYYY-MM-DDTHH:mm" en local runtime; es suficiente si runtime está en Madrid
        `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
          value.getDate()
        ).padStart(2, '0')}T${String(value.getHours()).padStart(2, '0')}:${String(
          value.getMinutes()
        ).padStart(2, '0')}`
      );
      return dt ?? value.toISOString();
    }

    return value;
  }
}
