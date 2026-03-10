import { SearchOperation, getDataOption, getSimpleOperation } from './search-operation.util';

describe('search-operation.util', () => {
  describe('getSimpleOperation', () => {
    it('debe devolver la operación correcta para claves válidas', () => {
      expect(getSimpleOperation('cn')).toBe(SearchOperation.CONTAINS);
      expect(getSimpleOperation('eq')).toBe(SearchOperation.EQUAL);
      expect(getSimpleOperation('lt')).toBe(SearchOperation.LESS_THAN);
      expect(getSimpleOperation('bw')).toBe(SearchOperation.BEGINS_WITH);
    });

    it('debe ser insensible a mayúsculas y minúsculas', () => {
      expect(getSimpleOperation('CN')).toBe(SearchOperation.CONTAINS);
      expect(getSimpleOperation('Eq')).toBe(SearchOperation.EQUAL);
    });

    it('debe devolver null para claves inválidas o desconocidas', () => {
      expect(getSimpleOperation('invalid')).toBeNull();
      expect(getSimpleOperation('')).toBeNull();
      expect(getSimpleOperation('xyz')).toBeNull();
    });
  });

  describe('getDataOption', () => {
    it('debe mapear "all" y "and" a SearchOperation.ALL', () => {
      expect(getDataOption('all')).toBe(SearchOperation.ALL);
      expect(getDataOption('and')).toBe(SearchOperation.ALL);
    });

    it('debe mapear "any" y "or" a SearchOperation.ANY', () => {
      expect(getDataOption('any')).toBe(SearchOperation.ANY);
      expect(getDataOption('or')).toBe(SearchOperation.ANY);
    });

    it('debe ser insensible a mayúsculas y minúsculas', () => {
      expect(getDataOption('ALL')).toBe(SearchOperation.ALL);
      expect(getDataOption('Or')).toBe(SearchOperation.ANY);
    });

    it('debe devolver null para opciones inválidas', () => {
      expect(getDataOption('not_exist')).toBeNull();
      expect(getDataOption('')).toBeNull();
    });
  });
});
