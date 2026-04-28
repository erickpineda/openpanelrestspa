import { of } from 'rxjs';

import { PublicEntradasFacadeService } from './public-entradas-facade.service';

describe('PublicEntradasFacadeService', () => {
  it('construye filtros (publicada, permitirComentario, titulo, categorias y etiquetas) y setea totalPages', () => {
    const buscarSafeSpy = jasmine
      .createSpy('buscarSafe')
      .and.returnValue(of({ elements: [{ idEntrada: 1 }], totalPages: 5 } as any));

    const entradaServiceMock: any = {
      buscarSafe: buscarSafeSpy,
      obtenerPorSlug: jasmine.createSpy('obtenerPorSlug'),
    };

    const stateMock: any = {
      loading$: of(false),
      entradas$: of([]),
      totalPages$: of(1),
      setLoading: jasmine.createSpy('setLoading'),
      setEntradas: jasmine.createSpy('setEntradas'),
      setTotalPages: jasmine.createSpy('setTotalPages'),
    };

    const sut = new PublicEntradasFacadeService(entradaServiceMock, stateMock);

    sut.buscarEntradasPublicas(
      0,
      10,
      'fechaPublicacion',
      'DESC',
      '  hello  ',
      true,
      [' Noticias ', 'Noticias', '', '  '],
      [' JAV ', 'JAV', '']
    );

    expect(stateMock.setLoading).toHaveBeenCalledWith(true);
    expect(buscarSafeSpy).toHaveBeenCalled();

    const [searchRequest, page, size, sortField, sortDirection] = buscarSafeSpy.calls.mostRecent().args;
    expect(page).toBe(0);
    expect(size).toBe(10);
    expect(sortField).toBe('fechaPublicacion');
    expect(sortDirection).toBe('DESC');

    const flatten = (node: any): any[] => {
      if (!node) return [];
      if (node.type === 'condition') return [node];
      if (node.type === 'group' && Array.isArray(node.children)) {
        return node.children.flatMap((c: any) => flatten(c));
      }
      return [];
    };

    const criteria = flatten(searchRequest?.node);
    expect(criteria.some((c) => c.field === 'publicada' && c.op === 'equal' && c.value === true)).toBeTrue();
    expect(
      criteria.some((c) => c.field === 'permitirComentario' && c.op === 'equal' && c.value === true)
    ).toBeTrue();
    expect(
      criteria.some((c) => c.field === 'titulo' && c.op === 'contains' && c.value === 'hello')
    ).toBeTrue();

    const categoriaCriteria = criteria.filter((c) => c.field === 'categoria.nombre');
    expect(categoriaCriteria.length).toBe(1);
    expect(categoriaCriteria[0].value).toBe('Noticias');

    const etiquetaCriteria = criteria.filter((c) => c.field === 'etiqueta.nombre');
    expect(etiquetaCriteria.length).toBe(1);
    expect(etiquetaCriteria[0].value).toBe('JAV');

    expect(stateMock.setEntradas).toHaveBeenCalledWith([{ idEntrada: 1 }]);
    expect(stateMock.setTotalPages).toHaveBeenCalledWith(5);
  });
});
