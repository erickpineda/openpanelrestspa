export type DataOption = 'AND' | 'OR';

export type Operation =
  | 'CONTAINS'
  | 'EQUAL'
  | 'NOT_EQUAL'
  | 'BEGINS_WITH'
  | 'ENDS_WITH'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IN'
  | 'NOT_IN';

export interface SearchCriterion {
  filterKey: string;
  operation: Operation | string;
  value: any;
  clazzName: string;
}

export interface AdvancedSearchParams {
  dataOption: DataOption;
  searchCriteriaList: SearchCriterion[];
}

export interface SingleFilter {
  campo: string;
  operacion: Operation | string;
  valor: any;
  dataOption?: DataOption;
}

export interface SearchRequest extends AdvancedSearchParams {}
