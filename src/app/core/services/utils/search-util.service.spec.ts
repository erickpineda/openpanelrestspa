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

  it('buildRequest should build SearchQuery (condition) and normalize ops', () => {
    const service = new SearchUtilService();

    const req = service.buildRequest(
      'Privilegio',
      [{ filterKey: 'nombre', value: 12, operation: 'CONTAINS' }],
      'ALL'
    );

    expect(req.node.type).toBe('condition');
    expect((req.node as any).field).toBe('nombre');
    expect((req.node as any).op).toBe('contains');
    expect((req.node as any).value).toBe(12);
  });

  it('buildRequest should handle null entityName and null value', () => {
    const service = new SearchUtilService();

    const req = service.buildRequest(
      null,
      [{ filterKey: 'nombre', value: null, operation: 'EQUAL' }],
      'ANY'
    );

    expect(req.node.type).toBe('condition');
    expect((req.node as any).field).toBe('nombre');
    expect((req.node as any).op).toBe('equal');
    expect((req.node as any).value).toBeNull();
  });

  it('buildSingle should delegate to buildRequest', () => {
    const service = new SearchUtilService();
    const req = service.buildSingle('Entrada', 'titulo', 'a', 'CONTAINS', 'AND');
    expect(req.node.type).toBe('condition');
    expect((req.node as any).field).toBe('titulo');
  });

  it('buildCondition should serialize date and datetime-local to final contract', () => {
    const service = new SearchUtilService();

    const dateNode = service.buildCondition('fechaPublicacion', 'equal', '2026-04-24');
    const dateTimeNode = service.buildCondition('fechaPublicacion', 'equal', '2026-04-24T10:15');

    expect(dateNode?.value).toBe('2026-04-24');
    expect(dateTimeNode?.value).toBe('2026-04-24T10:15:00');
  });
});
