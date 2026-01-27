import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_ERROR_HANDLING } from '@core/interceptor/skip-global-error.token';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  tap,
  throwError,
  of,
  switchMap,
} from 'rxjs';
import { Entrada } from '@app/core/models/entrada.model';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { mapEntradasComputed } from '../mappers/entrada.mapper';
import { LoggerService } from '@app/core/services/logger.service';
import { EntradaVM } from '../models/entrada.vm';

export interface SearchParams {
  term: string;
  field: string;
  operation: string;
  dataOption: string;
}
export interface AdvancedSearchParams {
  dataOption: string;
  searchCriteriaList: Array<{ filterKey: string; value: any; operation: string; clazzName: string }>;
}

export interface ListState {
  entradas: EntradaVM[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  error: any | null;
  allEntradasClientCache: EntradaVM[];
  isServerPaging: boolean;
  lastSearchParams: SearchParams | null;
  sortField?: string;
  sortDirection?: 'ASC' | 'DESC';
  lastAdvancedCriteriaList?: AdvancedSearchParams['searchCriteriaList'] | null;
  lastAdvancedDataOption?: string | null;
}

const INITIAL_STATE: ListState = {
  entradas: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  pageSize: 20,
  loading: false,
  error: null,
  allEntradasClientCache: [],
  isServerPaging: true,
  lastSearchParams: null,
  sortField: undefined,
  sortDirection: undefined,
  lastAdvancedCriteriaList: null,
  lastAdvancedDataOption: null,
};

@Injectable({
  providedIn: 'root',
})
export class ListadoEntradasStateService {
  private state = new BehaviorSubject<ListState>(INITIAL_STATE);
  state$ = this.state.asObservable();
  entradas$ = this.state.pipe(map((s) => s.entradas));
  loading$ = this.state.pipe(map((s) => s.loading));
  pagingInfo$ = this.state.pipe(
    map((s) => ({
      page: s.currentPage,
      total: s.totalElements,
      pages: s.totalPages,
      pageSize: s.pageSize,
    }))
  );

  constructor(
    private entradaService: EntradaService,
    private log: LoggerService
  ) {}

  setSort(field: string, direction: 'ASC' | 'DESC'): Observable<void> {
    const current = this.state.value;
    if (current.sortField !== field || current.sortDirection !== direction) {
      this.updateState({ sortField: field, sortDirection: direction });
      if (!current.isServerPaging && current.allEntradasClientCache.length > 0) {
        this.sortClientCache();
        this.applyClientPaging(current.allEntradasClientCache, 0, current.pageSize);
        return of(void 0);
      } else {
        return this.reloadCurrentPage();
      }
    }
    return of(void 0);
  }

  setPageSize(size: number): Observable<void> {
    const current = this.state.value;
    if (current.pageSize !== size) {
      this.state.next({ ...current, pageSize: size, currentPage: 0 });
      if (!current.isServerPaging && current.allEntradasClientCache.length > 0) {
        this.applyClientPaging(current.allEntradasClientCache, 0, size);
        return of(void 0);
      } else {
        return this.reloadCurrentPage();
      }
    }
    return of(void 0);
  }

  goToPage(page: number, searchParams?: SearchParams): Observable<void> {
    const current = this.state.value;
    if (current.isServerPaging) {
      if (searchParams) {
        return this.search(searchParams, page).pipe(map(() => void 0));
      }
      if (current.lastAdvancedCriteriaList && current.lastAdvancedDataOption) {
        return this.searchAdvanced(
          {
            dataOption: current.lastAdvancedDataOption,
            searchCriteriaList: current.lastAdvancedCriteriaList,
          },
          page
        ).pipe(map(() => void 0));
      }
      if (current.lastSearchParams) {
        return this.search(current.lastSearchParams, page).pipe(map(() => void 0));
      }
      this.log.warn('Intentando paginar en servidor sin parámetros de búsqueda');
      return of(void 0);
    } else {
      this.applyClientPaging(current.allEntradasClientCache, page, current.pageSize);
      return of(void 0);
    }
  }

  reloadCurrentPage(): Observable<void> {
    const current = this.state.value;
    if (current.lastAdvancedCriteriaList && current.lastAdvancedDataOption) {
      return this.searchAdvanced(
        {
          dataOption: current.lastAdvancedDataOption,
          searchCriteriaList: current.lastAdvancedCriteriaList,
        },
        current.currentPage
      ).pipe(map(() => void 0));
    }
    if (current.lastSearchParams) {
      return this.search(current.lastSearchParams, current.currentPage).pipe(map(() => void 0));
    }
    return of(void 0);
  }

  nextPage(): Observable<void> {
    const current = this.state.value;
    if (current.currentPage < current.totalPages - 1) {
      return this.goToPage(current.currentPage + 1);
    }
    return of(void 0);
  }

  prevPage(): Observable<void> {
    const current = this.state.value;
    if (current.currentPage > 0) {
      return this.goToPage(current.currentPage - 1);
    }
    return of(void 0);
  }

  deleteEntrada(id: number): Observable<void> {
    this.updateState({ loading: true, error: null });
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);
    return this.entradaService.borrar(id, context).pipe(
      switchMap(() => this.reloadCurrentPage()),
      map(() => void 0),
      catchError((error) => {
        this.log.error('Error deleting entrada', error);
        this.updateState({ loading: false, error });
        return throwError(() => error);
      }),
      finalize(() => this.updateState({ loading: false }))
    );
  }

  search(params: SearchParams, page: number = 0) {
    this.updateState({ loading: true, error: null, lastSearchParams: params });
    const searchRequest = {
      dataOption: params.dataOption,
      searchCriteriaList: [
        {
          filterKey: params.field,
          value: params.term,
          operation: params.operation,
          clazzName: 'Entrada',
        },
      ],
    };
    return this.entradaService.buscarSafe(searchRequest, page, this.state.value.pageSize).pipe(
      tap((response) => this.processResponse(response, page)),
      catchError((error) => {
        this.log.error('Error searching entradas', error);
        this.updateState({ loading: false, error });
        return throwError(() => error);
      }),
      finalize(() => this.updateState({ loading: false }))
    );
  }

  searchAdvanced(params: AdvancedSearchParams, page: number = 0) {
    this.updateState({
      loading: true,
      error: null,
      lastAdvancedCriteriaList: params.searchCriteriaList,
      lastAdvancedDataOption: params.dataOption,
      lastSearchParams: null,
    });
    const searchRequest = {
      dataOption: params.dataOption,
      searchCriteriaList: params.searchCriteriaList,
    };
    return this.entradaService.buscarSafe(searchRequest, page, this.state.value.pageSize).pipe(
      tap((response) => this.processResponse(response, page)),
      catchError((error) => {
        this.log.error('Error searching entradas (advanced)', error);
        this.updateState({ loading: false, error });
        return throwError(() => error);
      }),
      finalize(() => this.updateState({ loading: false }))
    );
  }

  private processResponse(data: any, pageRequest: number) {
    const raw =
      data?.elements ??
      (data as any)?.items ??
      (data as any)?.content ??
      (Array.isArray(data) ? data : []);
    const elementos: EntradaVM[] = mapEntradasComputed(
      Array.isArray(raw) ? raw : []
    );
    const hasServerPaging =
      typeof data?.totalPages === 'number' || typeof data?.totalElements === 'number';
    if (hasServerPaging) {
      const totalElements = Number(data.totalElements || elementos.length || 0);
      const totalPages = Number(
        data.totalPages || Math.ceil(totalElements / this.state.value.pageSize) || 1
      );
      this.updateState({
        entradas: this.sortElements(elementos, this.state.value.sortField, this.state.value.sortDirection),
        totalElements,
        totalPages,
        currentPage: pageRequest,
        isServerPaging: true,
        allEntradasClientCache: [],
      });
    } else {
      const totalElements = elementos.length;
      const pageSize = this.state.value.pageSize;
      const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
      this.updateState({
        allEntradasClientCache: elementos,
        totalElements,
        totalPages,
        isServerPaging: false,
      });
      // Sort if needed before applying paging
      if (this.state.value.sortField) {
        this.sortClientCache();
      }
      this.applyClientPaging(this.state.value.allEntradasClientCache, pageRequest, pageSize);
    }
  }

  private sortElements(elements: EntradaVM[], sortField?: string, sortDirection?: 'ASC' | 'DESC'): EntradaVM[] {
    if (!sortField || !elements.length) return elements;
    
    return [...elements].sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls/undefined
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Handle dates or strings
      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'ASC' ? -1 : 1;
      if (valA > valB) return sortDirection === 'ASC' ? 1 : -1;
      return 0;
    });
  }

  private sortClientCache() {
    const { sortField, sortDirection, allEntradasClientCache } = this.state.value;
    if (!sortField || !allEntradasClientCache.length) return;

    allEntradasClientCache.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls/undefined
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1; // Nulls last
      if (valB === null || valB === undefined) return -1;

      // Handle dates or strings
      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'ASC' ? -1 : 1;
      if (valA > valB) return sortDirection === 'ASC' ? 1 : -1;
      return 0;
    });
  }

  private applyClientPaging(allEntries: EntradaVM[], page: number, pageSize: number) {
    const totalPages = Math.max(1, Math.ceil(allEntries.length / pageSize));
    const validPage = Math.max(0, Math.min(page, totalPages - 1));
    const start = validPage * pageSize;
    const end = start + pageSize;
    const pagedEntries = allEntries.slice(start, end);
    this.updateState({
      entradas: pagedEntries,
      currentPage: validPage,
      totalPages: totalPages,
    });
  }

  private updateState(newState: Partial<ListState>) {
    this.state.next({ ...this.state.value, ...newState });
  }
}
