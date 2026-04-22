/**
 * Nuevo contrato de búsqueda avanzada (árbol AND/OR) + definitions.
 *
 * - Request: SearchQuery { node: SearchNode }
 * - Node: group(op, children[]) | condition(field, op, value?)
 * - Definitions: SearchDefinitions { fields[], example?, hints? }
 *
 * Nota: el backend espera `op` en minúsculas (contains, equal, null, ...).
 * Los GroupOp son `AND`/`OR` en mayúsculas.
 */

export type SearchGroupOp = 'AND' | 'OR';

export type SearchConditionOp =
  | 'contains'
  | 'does_not_contain'
  | 'equal'
  | 'not_equal'
  | 'begins_with'
  | 'does_not_begin_with'
  | 'ends_with'
  | 'does_not_end_with'
  | 'greater_than'
  | 'greater_than_equal'
  | 'less_than'
  | 'less_than_equal'
  | 'null'
  | 'not_null'
  | 'boolean'
  | string;

export interface SearchGroupNode {
  type: 'group';
  op: SearchGroupOp;
  children: SearchNode[];
}

export interface SearchConditionNode {
  type: 'condition';
  field: string;
  op: SearchConditionOp;
  /**
   * Debe omitirse para `null` / `not_null`.
   *
   * Nota (fechas):
   * - date: 'dd-MM-yyyy'
   * - datetime: 'dd-MM-yyyy HH:mm:ss' (Europe/Madrid)
   */
  value?: any;
}

export type SearchNode = SearchGroupNode | SearchConditionNode;

export interface SearchQuery {
  node: SearchNode;
}

export type SearchFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  | string;

export interface SearchFieldDefinition {
  key: string;
  type: SearchFieldType;
  operations: SearchConditionOp[];
  nullable?: boolean;
  sortable?: boolean;
  enumValues?: string[];
  // Extensible
  label?: string;
  widget?: string;
  placeholder?: string;
  uiGroup?: string;
}

export interface SearchDefinitions {
  entity: string;
  version?: string;
  fields: SearchFieldDefinition[];
  example?: SearchQuery;
  hints?: string[];
}
