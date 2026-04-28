import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError, throwError } from 'rxjs';
import { Entrada } from '@app/core/models/entrada.model';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { ListadoEntradasStateService } from './listado-entradas-state.service';
import { SearchParams } from '../models/search-params.model';
import { SearchConditionNode, SearchDefinitions, SearchQuery } from '@app/shared/models/search.models';
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
    const d = (defs?.data ?? defs) as SearchDefinitions | any;
    const fields = Array.isArray(d?.fields) ? (d.fields as any[]) : [];
    const keys = fields.map((f) => String(f?.key ?? '')).filter((k) => k.length > 0);

    const camposOrdenados = [
      ...keys.filter((k) => k === 'titulo'),
      ...keys.filter((k) => k !== 'titulo').sort((a, b) => a.localeCompare(b)),
    ];
    const field = camposOrdenados[0] || '';
    const fieldDef = fields.find((f: any) => f?.key === field);
    const operation = Array.isArray(fieldDef?.operations) ? fieldDef.operations[0] : 'contains';
    return { field, operation };
  }

  setBasicSearchText(text: string): void {
    this.currentField = 'titulo';
    const d = (this.defs?.data ?? this.defs) as SearchDefinitions | any;
    const fieldDef = Array.isArray(d?.fields) ? d.fields.find((f: any) => f?.key === 'titulo') : null;
    this.currentOperation =
      Array.isArray(fieldDef?.operations) && fieldDef.operations.length > 0
        ? fieldDef.operations[0]
        : 'contains';
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

  applySearchQuery(query: SearchQuery, page?: number): Observable<any> {
    const first = this.findFirstCondition(query?.node);
    if (first) {
      this.currentField = first.field;
      this.currentOperation = first.op;
      this.currentTerm = String(first.value ?? '');
    }
    return this.stateService.searchQuery(query, page ?? 0);
  }

  private findFirstCondition(node: any): SearchConditionNode | undefined {
    if (!node) return undefined;
    if (node.type === 'condition') return node as SearchConditionNode;
    if (node.type === 'group' && Array.isArray(node.children)) {
      for (const child of node.children) {
        const found = this.findFirstCondition(child);
        if (found) return found;
      }
    }
    return undefined;
  }
}
