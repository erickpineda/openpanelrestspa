import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Observable, Subject, catchError, finalize, throwError, takeUntil } from 'rxjs';
import { EntradaCatalogService } from '@app/core/services/data/entrada-catalog.service';
import { Entrada } from '@app/core/models/entrada.model';
import { EntradaVM } from './models/entrada.vm';
import { CommonFunctionalityService } from '@shared/services/common-functionality.service';
import { parseAllowedDate } from '@shared/utils/date-utils';
import { ToastService } from '@app/core/services/ui/toast.service';
import { ErrorBoundaryService } from '@app/core/errors/error-boundary/error-boundary.service';
import { ErrorBoundaryComponent } from '@shared/components/errors/error-boundary/error-boundary.component';
import { LoggerService } from '@app/core/services/logger.service';
import { Router } from '@angular/router';
import { SearchParams } from './services';
import { EntradasListFacadeService } from './services/entradas-list-facade.service';
import { getPreviewStateColor as getPreviewStateColorHelper } from './utils/estado-utils';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ListadoEntradasComponent implements OnInit, OnDestroy, AfterViewInit {
  entradas$ = this.facade.entradas$;
  pagingInfo$ = this.facade.pagingInfo$;
  loading$ = this.facade.loading$;
  definiciones: any;
  campoSeleccionado: string = '';
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';
  dataOptionSeleccionada: string = 'AND';
  showAdvanced = false;
  basicSearchText = '';
  visible = false;
  entradaABorrar: EntradaVM | null = null;
  previewEntrada?: EntradaVM;
  previewVisible: boolean = false;
  currentSortField?: string;
  currentSortDirection?: 'ASC' | 'DESC';
  @ViewChild('previewCloseBtn') previewCloseBtn?: ElementRef<HTMLButtonElement>;
  private destroy$ = new Subject<void>();
  private readonly boundaryId = 'listado-entradas-main';
  constructor(
    public commonFuncService: CommonFunctionalityService,
    private facade: EntradasListFacadeService,
    private toastService: ToastService,
    private errorBoundaryService: ErrorBoundaryService,
    private log: LoggerService,
    private router: Router,
    private entradaCatalogService: EntradaCatalogService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private datePipe: DatePipe
  ) {}
  ngOnInit(): void {
    this.facade.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.currentSortField = state.sortField;
      this.currentSortDirection = state.sortDirection;
      this.cdr.markForCheck();
    });

    this.cargarDefinicionesBuscador();
    this.facade.iniciarBusqueda(
      (term, page) => this.facade.searchByCurrent(term, page),
      () => {}
    );
  }
  ngAfterViewInit(): void {
    try {
      this.cdr.detectChanges();
    } catch {}
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.errorBoundaryService.unregisterBoundary(this.boundaryId);
    this.facade.limpiarBusqueda();
  }
  onBoundaryInit(boundary: ErrorBoundaryComponent): void {
    this.errorBoundaryService.registerBoundary(this.boundaryId, boundary);
  }
  private cargarDefinicionesBuscador(): void {
    this.cdr.markForCheck();
    this.facade
      .loadSearchDefinitionsWithFeedback()
      .pipe(
        finalize(() => {
          this.cdr.detectChanges();
        }),
        catchError((error) => {
          this.errorBoundaryService.reportErrorToBoundary(
            this.boundaryId,
            error,
            'CargarDefinicionesBuscador'
          );
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.definiciones = response;
            this.facade.setDefinitions(response);
            this.inicializarCamposBusqueda();
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.log.error('Error secundario:', error);
          this.cdr.markForCheck();
        },
      });
  }
  private inicializarCamposBusqueda(): void {
    this.facade.setDefaultsFromDefinitions();
    this.campoSeleccionado = this.facade.getCurrentField() || '';
    this.operacionSeleccionada = this.facade.getCurrentOperation() || '';
    this.valorBusqueda = '';
    if (this.campoSeleccionado && this.operacionSeleccionada) {
      this.zone.run(() => setTimeout(() => this.facade.triggerBusqueda(this.valorBusqueda), 0));
    }
  }
  private realizarBusquedaEntradas(term: string, page?: number): Observable<any> {
    const searchParams: SearchParams = {
      term,
      field: this.campoSeleccionado,
      operation: this.operacionSeleccionada,
      dataOption: this.dataOptionSeleccionada,
    };
    return this.facade.search(searchParams, page);
  }
  obtenerListaEntradas(page: number): void {
    const searchParams: SearchParams = {
      term: this.valorBusqueda,
      field: this.campoSeleccionado,
      operation: this.operacionSeleccionada,
      dataOption: this.dataOptionSeleccionada,
    };
    this.facade.goToPage(page, searchParams).subscribe();
  }
  refrescarDatos(): void {
    this.facade.refresh().subscribe();
  }
  public cargarCatalogosEntrada = (): Observable<{ [key: string]: string[] }> => {
    return this.entradaCatalogService.obtenerCatalogosEntrada();
  };
  onPageSizeChange(size: number): void {
    this.facade.setPageSize(size).subscribe();
  }
  onNext(): void {
    this.facade.nextPage().subscribe();
  }
  onPrev(): void {
    this.facade.prevPage().subscribe();
  }
  public toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }
  public onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text;
    this.facade.setBasicSearchText(text);
    this.campoSeleccionado = this.facade.getCurrentField() || 'titulo';
    this.operacionSeleccionada = this.facade.getCurrentOperation() || 'CONTAINS';
    this.valorBusqueda = text;
  }
  public aplicarFiltro(filtro: any): void {
    if (Array.isArray(filtro?.searchCriteriaList)) {
      if (filtro.dataOption) {
        this.dataOptionSeleccionada = filtro.dataOption;
        this.facade.setDataOption(filtro.dataOption);
      }
      this.facade.applyAdvancedFilters({
        dataOption: (filtro.dataOption as 'AND' | 'OR') || (this.dataOptionSeleccionada as 'AND' | 'OR'),
        searchCriteriaList: filtro.searchCriteriaList,
      }).subscribe();
      const first = filtro.searchCriteriaList[0];
      this.campoSeleccionado = first?.filterKey || this.campoSeleccionado;
      this.operacionSeleccionada = first?.operation || this.operacionSeleccionada;
      this.valorBusqueda = String(first?.value ?? this.valorBusqueda);
    } else {
      this.facade.applyFilter({
        campo: filtro.campo,
        operacion: filtro.operacion,
        valor: filtro.valor,
        dataOption: this.dataOptionSeleccionada,
      });
      this.campoSeleccionado = this.facade.getCurrentField() || filtro.campo;
      this.operacionSeleccionada = this.facade.getCurrentOperation() || filtro.operacion;
      this.valorBusqueda = filtro.valor;
    }
    this.cdr.markForCheck();
  }
  public onFiltroChanged(filtro: any): void {
    if (Array.isArray(filtro?.searchCriteriaList)) {
      if (filtro.dataOption) {
        this.dataOptionSeleccionada = filtro.dataOption;
        this.facade.setDataOption(filtro.dataOption);
      }
      const first = filtro.searchCriteriaList[0];
      this.campoSeleccionado = first?.filterKey || this.campoSeleccionado;
      this.operacionSeleccionada = first?.operation || this.operacionSeleccionada;
      this.valorBusqueda = String(first?.value ?? this.valorBusqueda);
    } else {
      this.facade.updateFilterState({
        campo: filtro.campo,
        operacion: filtro.operacion,
        valor: filtro.valor,
        dataOption: this.dataOptionSeleccionada,
      });
      this.campoSeleccionado = this.facade.getCurrentField() || filtro.campo;
      this.operacionSeleccionada = this.facade.getCurrentOperation() || filtro.operacion;
      this.valorBusqueda = filtro.valor;
    }
  }
  abrirModalEliminar(entrada: EntradaVM): void {
    this.entradaABorrar = entrada;
    this.visible = true;
    this.cdr.markForCheck();
  }
  borrarEntrada(entrada: EntradaVM): void {
    this.entradaABorrar = entrada;
    this.visible = true;
    this.cdr.markForCheck();
  }

  ordenar(field: string, direction: 'ASC' | 'DESC'): void {
    this.facade.setSort(field, direction).subscribe();
  }

  setDataOption(option: 'AND' | 'OR'): void {
    this.dataOptionSeleccionada = option;
    this.facade.setDataOption(option);
    this.facade.refresh().subscribe();
    this.cdr.markForCheck();
  }

  getSortIcon(): string {
    if (!this.currentSortField) return 'cilSortAlphaDown';
    return this.currentSortDirection === 'ASC' ? 'cilSortAlphaUp' : 'cilSortAlphaDown';
  }

  getDataOptionLabel(): string {
    return this.dataOptionSeleccionada === 'AND' ? 'Coincidir con todas' : 'Coincidir con alguna';
  }

  isSortActive(field: string, direction: 'ASC' | 'DESC'): boolean {
    return this.currentSortField === field && this.currentSortDirection === direction;
  }

  confirmarBorrado(): void {
    if (this.entradaABorrar) {
      this.facade.deleteEntrada(this.entradaABorrar.idEntrada).subscribe({
        next: () => {
          this.entradaABorrar = null;
          this.visible = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.visible = false;
          this.cdr.markForCheck();
        },
      });
    }
  }
  toggleModal(): void {
    this.visible = !this.visible;
    if (!this.visible) {
      this.entradaABorrar = null;
    }
    this.cdr.markForCheck();
  }
  onVisibleModalChange(visible: boolean): void {
    this.visible = visible;
    if (!visible) {
      this.entradaABorrar = null;
    }
    this.cdr.markForCheck();
    try {
      this.cdr.detectChanges();
    } catch {}
  }
  openPreview(entrada: EntradaVM): void {
    this.previewEntrada = entrada;
    this.previewVisible = true;
    setTimeout(() => {
      try {
        this.previewCloseBtn?.nativeElement?.focus();
      } catch {}
    }, 50);
  }

  getPreviewStateColor(entrada?: EntradaVM): string {
    return getPreviewStateColorHelper(entrada);
  }

  closePreview(): void {
    this.previewVisible = false;
    this.cdr.markForCheck();
  }
  onPreviewVisibleChange(visible: boolean): void {
    this.previewVisible = visible;
    this.cdr.markForCheck();
  }
  onEditarDesdePreview(): void {
    const idEntrada = this.previewEntrada?.idEntrada;
    if (idEntrada) {
      this.closePreview();
      setTimeout(() => {
        this.router.navigate(['/admin/control/entradas/editar', idEntrada]);
      }, 350);
    }
  }
  checkFechaPublicacion(fechaPublicacion: any): string {
    const date = parseAllowedDate(fechaPublicacion);
    return date ? this.datePipe.transform(date, 'dd-MM-yyyy') || '' : 'No publicada';
  }
  getFechaDate(fecha: any): Date | null {
    return parseAllowedDate(fecha);
  }
}
