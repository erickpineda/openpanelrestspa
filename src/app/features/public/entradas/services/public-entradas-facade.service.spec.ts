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

    const criteria = (searchRequest?.searchCriteriaList ?? []) as any[];
    expect(criteria.some((c) => c.filterKey === 'publicada' && c.value === true)).toBeTrue();
    expect(criteria.some((c) => c.filterKey === 'permitirComentario' && c.value === true)).toBeTrue();
    expect(criteria.some((c) => c.filterKey === 'titulo' && c.operation === 'CONTAINS' && c.value === 'hello'))
      .toBeTrue();

    const categoriaCriteria = criteria.filter((c) => c.filterKey === 'categoria.nombre');
    expect(categoriaCriteria.length).toBe(1);
    expect(categoriaCriteria[0].value).toBe('Noticias');

    const etiquetaCriteria = criteria.filter((c) => c.filterKey === 'etiqueta.nombre');
    expect(etiquetaCriteria.length).toBe(1);
    expect(etiquetaCriteria[0].value).toBe('JAV');

    expect(stateMock.setEntradas).toHaveBeenCalledWith([{ idEntrada: 1 }]);
    expect(stateMock.setTotalPages).toHaveBeenCalledWith(5);
  });
});

