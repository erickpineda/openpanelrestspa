import { SearchOperation } from '../../_utils/search-operation.util';
import { SearchUtilService } from './search-util.service';

describe('SearchUtilService', () => {
  it('getOperation should map short codes', () => {
    const service = new SearchUtilService();
    expect(service.getOperation('cn')).toBe(SearchOperation.CONTAINS);
    expect(service.getOperation('EQ')).toBe(SearchOperation.EQUAL);
    expect(service.getOperation('unknown')).toBeNull();
  });

  it('getOption should map data options', () => {
    const service = new SearchUtilService();
    expect(service.getOption('and')).toBe(SearchOperation.ALL);
    expect(service.getOption('OR')).toBe(SearchOperation.ANY);
    expect(service.getOption('x')).toBeNull();
  });

  it('getOperacionesDisponibles should include expected items', () => {
    const service = new SearchUtilService();
    const ops = service.getOperacionesDisponibles();
    expect(ops.length).toBeGreaterThan(0);
    expect(ops.some((o) => o.valor === SearchOperation.CONTAINS)).toBeTrue();
  });

  it('buildRequest should stringify values and include clazzName when provided', () => {
    const service = new SearchUtilService();

    const req = service.buildRequest(
      'Privilegio',
      [{ filterKey: 'nombre', value: 12, operation: 'CONTAINS' }],
      'ALL'
    );

    expect(req.dataOption).toBe('ALL');
    expect(req.searchCriteriaList).toEqual([
      {
        filterKey: 'nombre',
        value: '12',
        operation: 'CONTAINS',
        clazzName: 'Privilegio',
      },
    ]);
  });

  it('buildRequest should handle null entityName and null value', () => {
    const service = new SearchUtilService();

    const req = service.buildRequest(
      null,
      [{ filterKey: 'nombre', value: null, operation: 'EQUAL' }],
      'ANY'
    );

    expect(req.searchCriteriaList[0].clazzName).toBeUndefined();
    expect(req.searchCriteriaList[0].value).toBe('');
  });

  it('buildSingle should delegate to buildRequest', () => {
    const service = new SearchUtilService();
    const req = service.buildSingle('Entrada', 'titulo', 'a', 'CONTAINS', 'AND');
    expect(req.dataOption).toBe('AND');
    expect(req.searchCriteriaList.length).toBe(1);
  });
});
