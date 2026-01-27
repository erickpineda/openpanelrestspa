import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
        service.pagingInfo$.subscribe((pi) => {
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
});
