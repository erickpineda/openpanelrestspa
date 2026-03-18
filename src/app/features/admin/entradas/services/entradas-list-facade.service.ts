import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError, throwError } from 'rxjs';
import { Entrada } from '@app/core/models/entrada.model';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { ListadoEntradasStateService } from './listado-entradas-state.service';
import { SearchParams } from '../models/search-params.model';
import { AdvancedSearchParams } from '@app/shared/models/search.models';
import { BusquedaService } from '@app/core/services/srv-busqueda/busqueda.service';
import { TranslationService } from '@app/core/services/translation.service';
import { ToastService } from '@app/core/services/ui/toast.service';
import { OPConstants } from '@app/shared/constants/op-global.constants';

@Injectable({ providedIn: 'root' })
export class EntradasListFacadeService {
  readonly state$ = this.stateService.state$;
  readonly entradas$ = this.stateService.entradas$;
  readonly pagingInfo$ = this.stateService.pagingInfo$;
  readonly loading$ = this.stateService.loading$;
  private defs: any;
  private currentField?: string;
  private currentOperation?: string;
  private currentDataOption: string = OPConstants.App.Admin.Entradas.DEFAULT_DATA_OPTION;
  private currentTerm: string = '';

  constructor(
    private readonly stateService: ListadoEntradasStateService,
    private readonly entradaService: EntradaService,
    private readonly busquedaService: BusquedaService,
    private readonly translate: TranslationService,
    private readonly toast: ToastService
  ) {}

  loadSearchDefinitions(): Observable<any> {
    return this.entradaService.obtenerDefinicionesBuscadorSafe();
  }
  loadSearchDefinitionsWithFeedback(): Observable<any> {
    return this.entradaService.obtenerDefinicionesBuscadorSafe().pipe(
      catchError((error) => {
        const msg = this.translate.instant('ADMIN.ENTRIES.ERROR.LOAD_DEFINITIONS');
        const title = this.translate.instant('COMMON.ERROR');
        this.toast.showError(msg, title);
        return throwError(() => error);
      })
    );
  }

  setDefinitions(defs: any): void {
    this.defs = defs;
  }

  setDefaultsFromDefinitions(): void {
    const def = this.computeDefaultSearch(this.defs);
    this.currentField = def.field;
    this.currentOperation = def.operation;
  }

  search(params: SearchParams, page?: number): Observable<any> {
    this.currentField = params.field;
    this.currentOperation = params.operation;
    this.currentDataOption = params.dataOption;
    this.currentTerm = params.term;
    return this.stateService.search(params, page);
  }

  searchByCurrent(term: string, page?: number): Observable<any> {
    this.currentTerm = term;
    const params: SearchParams = {
      term,
      field: this.currentField || '',
      operation: this.currentOperation || 'CONTAINS',
      dataOption: this.currentDataOption,
    };
    return this.search(params, page);
  }

  goToPage(page: number, params?: SearchParams): Observable<void> {
    return this.stateService.goToPage(page, params);
  }

  setPageSize(size: number): Observable<void> {
    return this.stateService.setPageSize(size);
  }

  setSort(field: string, direction: 'ASC' | 'DESC'): Observable<void> {
    return this.stateService.setSort(field, direction);
  }

  nextPage(): Observable<void> {
    return this.stateService.nextPage();
  }

  prevPage(): Observable<void> {
    return this.stateService.prevPage();
  }

  deleteEntrada(id: number): Observable<void> {
    return this.stateService.deleteEntrada(id).pipe(
      tap(() => {
        const msg = this.translate.instant('ADMIN.ENTRIES.SUCCESS.DELETE');
        const title = this.translate.instant('MENU.ENTRIES');
        this.toast.showSuccess(msg, title);
      }),
      catchError((error) => {
        const msg = this.translate.instant('ADMIN.ENTRIES.ERROR.DELETE');
        const title = this.translate.instant('COMMON.ERROR');
        this.toast.showError(msg, title);
        return throwError(() => error);
      })
    );
  }

  iniciarBusqueda(
    searchFunction: (term: string, page?: number) => Observable<any>,
    callback: (results: any) => void,
    delay: number = 300
  ): void {
    this.busquedaService.iniciarBusqueda(searchFunction as any, callback as any, delay);
  }

  triggerBusqueda(term: string): void {
    this.busquedaService.triggerBusqueda(term);
  }

  limpiarBusqueda(): void {
    this.busquedaService.limpiarBusqueda();
  }

  computeDefaultSearch(defs: any): { field: string; operation: string } {
    const campos: string[] = (defs?.filterKeySegunClazzNamePermitido as string[]) || [];
    const camposOrdenados = [
      ...campos.filter((k) => k === 'titulo'),
      ...campos.filter((k) => k !== 'titulo').sort((a, b) => a.localeCompare(b)),
    ];
    const campo = camposOrdenados[0] || '';
    const operaciones = defs?.operationPermitido?.[campo];
    const operacion = Array.isArray(operaciones) ? operaciones[0] : '';
    return { field: campo, operation: operacion };
  }

  setBasicSearchText(text: string): void {
    const operaciones = this.defs?.operationPermitido?.['titulo'];
    this.currentField = 'titulo';
    this.currentOperation =
      Array.isArray(operaciones) && operaciones.length > 0 ? operaciones[0] : 'CONTAINS';
    this.triggerBusqueda(text);
  }

  getCurrentField(): string | undefined {
    return this.currentField;
  }

  getCurrentOperation(): string | undefined {
    return this.currentOperation;
  }

  refresh(): Observable<void> {
    if (!this.currentField || !this.currentOperation) {
      return this.stateService.reloadCurrentPage();
    }
    const params: SearchParams = {
      term: this.currentTerm,
      field: this.currentField,
      operation: this.currentOperation,
      dataOption: this.currentDataOption,
    };
    return this.search(params);
  }

  applyFilter(filtro: {
    campo: string;
    operacion: string;
    valor: string;
    dataOption?: string;
  }): void {
    this.currentField = filtro.campo;
    this.currentOperation = filtro.operacion;
    this.currentTerm = filtro.valor;
    if (filtro.dataOption) this.currentDataOption = filtro.dataOption;
    this.triggerBusqueda(this.currentTerm);
  }

  updateFilterState(filtro: {
    campo: string;
    operacion: string;
    valor: string;
    dataOption?: string;
  }): void {
    this.currentField = filtro.campo;
    this.currentOperation = filtro.operacion;
    this.currentTerm = filtro.valor;
    if (filtro.dataOption) this.currentDataOption = filtro.dataOption;
  }

  setDataOption(option: 'AND' | 'OR'): void {
    this.currentDataOption = option;
  }

  applyAdvancedFilters(payload: AdvancedSearchParams, page?: number): Observable<any> {
    this.currentDataOption = payload.dataOption;
    const first = payload.searchCriteriaList?.[0];
    if (first) {
      this.currentField = first.filterKey;
      this.currentOperation = first.operation;
      this.currentTerm = String(first.value ?? '');
    }
    const mapped = payload.searchCriteriaList.map((c) => ({
      filterKey: c.filterKey,
      operation: c.operation,
      value: c.value,
      clazzName: c.clazzName || 'Entrada',
    }));
    return this.stateService.searchAdvanced(
      { dataOption: payload.dataOption, searchCriteriaList: mapped },
      page ?? 0
    );
  }
}
