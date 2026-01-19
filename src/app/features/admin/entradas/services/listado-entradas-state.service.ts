import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, tap, throwError, of, switchMap } from 'rxjs';
import { Entrada } from '@app/core/models/entrada.model';
import { Categoria } from '@app/core/models/categoria.model';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { LoggerService } from '@app/core/services/logger.service';

export interface SearchParams {
  term: string;
  field: string;
  operation: string;
  dataOption: string;
}

export interface ListState {
  entradas: Entrada[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  error: any | null;
  allEntradasClientCache: Entrada[];
  isServerPaging: boolean;
  lastSearchParams: SearchParams | null;
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
  lastSearchParams: null
};

@Injectable({
  providedIn: 'root'
})
export class ListadoEntradasStateService {
  private state = new BehaviorSubject<ListState>(INITIAL_STATE);
  state$ = this.state.asObservable();
  entradas$ = this.state.pipe(map(s => s.entradas));
  loading$ = this.state.pipe(map(s => s.loading));
  pagingInfo$ = this.state.pipe(map(s => ({
    page: s.currentPage,
    total: s.totalElements,
    pages: s.totalPages,
    pageSize: s.pageSize
  })));

  constructor(
    private entradaService: EntradaService,
    private log: LoggerService
  ) {}

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
      const params = searchParams || current.lastSearchParams;
      if (params) {
        return this.search(params, page).pipe(map(() => void 0));
      } else {
        this.log.warn('Intentando paginar en servidor sin parámetros de búsqueda');
        return of(void 0);
      }
    } else {
      this.applyClientPaging(current.allEntradasClientCache, page, current.pageSize);
      return of(void 0);
    }
  }

  reloadCurrentPage(): Observable<void> {
    const current = this.state.value;
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
    return this.entradaService.borrar(id).pipe(
      switchMap(() => this.reloadCurrentPage()),
      map(() => void 0),
      catchError(error => {
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
      tap(response => this.processResponse(response, page)),
      catchError(error => {
        this.log.error('Error searching entradas', error);
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
    let elementos: Entrada[] = Array.isArray(raw) ? raw : [];
    elementos = elementos.map((entrada: Entrada) => ({
      ...entrada,
      categoriasConComas: entrada.categorias?.map((e: Categoria) => e.nombre).join(', ') || '',
    }));
    const hasServerPaging =
      typeof data?.totalPages === 'number' || typeof data?.totalElements === 'number';
    if (hasServerPaging) {
      const totalElements = Number(data.totalElements || elementos.length || 0);
      const totalPages = Number(data.totalPages || Math.ceil(totalElements / this.state.value.pageSize) || 1);
      this.updateState({
        entradas: elementos,
        totalElements,
        totalPages,
        currentPage: pageRequest,
        isServerPaging: true,
        allEntradasClientCache: []
      });
    } else {
      const totalElements = elementos.length;
      const pageSize = this.state.value.pageSize;
      const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
      this.updateState({
        allEntradasClientCache: elementos,
        totalElements,
        totalPages,
        isServerPaging: false
      });
      this.applyClientPaging(elementos, pageRequest, pageSize);
    }
  }

  private applyClientPaging(allEntries: Entrada[], page: number, pageSize: number) {
    const totalPages = Math.max(1, Math.ceil(allEntries.length / pageSize));
    const validPage = Math.max(0, Math.min(page, totalPages - 1));
    const start = validPage * pageSize;
    const end = start + pageSize;
    const pagedEntries = allEntries.slice(start, end);
    this.updateState({
      entradas: pagedEntries,
      currentPage: validPage,
      totalPages: totalPages
    });
  }

  private updateState(newState: Partial<ListState>) {
    this.state.next({ ...this.state.value, ...newState });
  }
}
