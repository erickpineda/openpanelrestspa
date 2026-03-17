import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { take } from 'rxjs/operators';
import { ListadoEntradasStateService } from './listado-entradas-state.service';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { AdvancedSearchParams } from '@app/shared/models/search.models';

describe('ListadoEntradasStateService', () => {
  let service: ListadoEntradasStateService;
  let entradaServiceSpy: jasmine.SpyObj<EntradaService>;

  beforeEach(() => {
    entradaServiceSpy = jasmine.createSpyObj('EntradaService', ['buscarSafe']);
    TestBed.configureTestingModule({
      providers: [
        ListadoEntradasStateService,
        { provide: EntradaService, useValue: entradaServiceSpy },
      ],
    });
    service = TestBed.inject(ListadoEntradasStateService);
  });

  it('searchAdvanced actualiza estado y llama buscarSafe', (done) => {
    const mockResponse = { elements: [], totalPages: 1 };
    entradaServiceSpy.buscarSafe.and.returnValue(of(mockResponse as any));

    const params: AdvancedSearchParams = {
      dataOption: 'AND',
      searchCriteriaList: [
        { filterKey: 'titulo', operation: 'CONTAINS', value: 'abc', clazzName: 'Entrada' },
      ],
    };
    service.searchAdvanced(params, 0).subscribe({
      next: () => {
        expect(entradaServiceSpy.buscarSafe).toHaveBeenCalled();
        service.pagingInfo$.pipe(take(1)).subscribe((pi: any) => {
          expect(pi.pages).toBe(1);
          done();
        });
      },
      error: done.fail,
    });
  });

  it('reloadCurrentPage usa búsqueda avanzada previa', (done) => {
    const mockResponse = { elements: [], totalPages: 2 };
    entradaServiceSpy.buscarSafe.and.returnValue(of(mockResponse as any));
    const params: AdvancedSearchParams = {
      dataOption: 'OR',
      searchCriteriaList: [
        { filterKey: 'estadoEntrada.nombre', operation: 'EQUAL', value: 'Publicada', clazzName: 'Entrada' },
      ],
    };
    service.searchAdvanced(params, 0).subscribe(() => {
      service.reloadCurrentPage().subscribe({
        next: () => {
          expect(entradaServiceSpy.buscarSafe).toHaveBeenCalledTimes(2);
          done();
        },
        error: done.fail,
      });
    });
  });

  it('goToPage sin parámetros usa criterios avanzados previos', (done) => {
    const mockResponse = { elements: [], totalPages: 5, totalElements: 100 };
    entradaServiceSpy.buscarSafe.and.returnValue(of(mockResponse as any));
    const params: AdvancedSearchParams = {
      dataOption: 'AND',
      searchCriteriaList: [
        { filterKey: 'titulo', operation: 'CONTAINS', value: 'algo', clazzName: 'Entrada' },
      ],
    };
    service.searchAdvanced(params, 0).subscribe({
      next: () => {
        service.goToPage(3).subscribe({
          next: () => {
            expect(entradaServiceSpy.buscarSafe).toHaveBeenCalledTimes(2);
            const args = entradaServiceSpy.buscarSafe.calls.mostRecent().args;
            expect(args[1]).toBe(3);
            done();
          },
          error: done.fail,
        });
      },
      error: done.fail,
    });
  });

  it('reloadCurrentPage uses basic search params after switching from advanced to basic', (done) => {
    const mockResponse = { elements: [], totalPages: 1 };
    entradaServiceSpy.buscarSafe.and.returnValue(of(mockResponse as any));

    // 1. Advanced Search
    const advancedParams: AdvancedSearchParams = {
      dataOption: 'AND',
      searchCriteriaList: [
        { filterKey: 'titulo', operation: 'CONTAINS', value: 'advanced', clazzName: 'Entrada' },
      ],
    };

    service.searchAdvanced(advancedParams, 0).subscribe(() => {
      // 2. Basic Search
      const basicParams: any = {
        term: 'basic',
        field: 'titulo',
        operation: 'CONTAINS',
        dataOption: 'AND',
      };
      service.search(basicParams, 0).subscribe(() => {
        // Reset spy to clear previous calls
        entradaServiceSpy.buscarSafe.calls.reset();

        // 3. Reload Page
        service.reloadCurrentPage().subscribe(() => {
          expect(entradaServiceSpy.buscarSafe).toHaveBeenCalled();
          const args = entradaServiceSpy.buscarSafe.calls.mostRecent().args;
          const searchRequest = args[0];
          // Should be 'basic' value, not 'advanced'
          expect(searchRequest.searchCriteriaList[0].value).toBe('basic');
          done();
        });
      });
    });
  });
});
