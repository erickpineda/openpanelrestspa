export enum SearchOperation {
  CONTAINS = 'contains',
  DOES_NOT_CONTAIN = 'does_not_contain',
  EQUAL = 'equal',
  NOT_EQUAL = 'not_equal',
  BEGINS_WITH = 'begins_with',
  DOES_NOT_BEGIN_WITH = 'does_not_begin_with',
  ENDS_WITH = 'ends_with',
  DOES_NOT_END_WITH = 'does_not_end_with',
  NUL = 'null',
  NOT_NULL = 'not_null',
  GREATER_THAN = 'greater_than',
  GREATER_THAN_EQUAL = 'greater_than_equal',
  LESS_THAN = 'less_than',
  LESS_THAN_EQUAL = 'less_than_equal',
  ANY = 'any',
  ALL = 'all',
  AND = 'and',
  OR = 'or',
  BOOLEAN = 'boolean',
}

const SIMPLE_OPERATION_SET: string[] = [
  'cn',
  'nc',
  'eq',
  'ne',
  'bw',
  'bn',
  'ew',
  'en',
  'nu',
  'nn',
  'gt',
  'ge',
  'lt',
  'le',
];

const DATA_OPTION_SET: string[] = ['all', 'and', 'any', 'or'];

const operationMap: Map<string, SearchOperation> = createOperationMap();
const dataOptionMap: Map<string, SearchOperation> = createDataOptionMap();

function createOperationMap(): Map<string, SearchOperation> {
  const map = new Map<string, SearchOperation>();
  const values = Object.values(SearchOperation);
  SIMPLE_OPERATION_SET.forEach((key, index) => {
    map.set(key, values[index] as SearchOperation);
  });
  return map;
}

function createDataOptionMap(): Map<string, SearchOperation> {
  const map = new Map<string, SearchOperation>();
  DATA_OPTION_SET.forEach((option) => {
    if (option === 'all' || option === 'and') {
      map.set(option, SearchOperation.ALL);
    } else if (option === 'any' || option === 'or') {
      map.set(option, SearchOperation.ANY);
    }
  });
  return map;
}

export function getSimpleOperation(input: string): SearchOperation | null {
  return operationMap.get(input.toLowerCase()) || null;
}

export function getDataOption(input: string): SearchOperation | null {
  return dataOptionMap.get(input.toLowerCase()) || null;
}
