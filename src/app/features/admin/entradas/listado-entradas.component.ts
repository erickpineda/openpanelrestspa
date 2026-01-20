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
import { Observable, Subject, catchError, finalize, throwError } from 'rxjs';
import { EntradaCatalogService } from '@app/core/services/data/entrada-catalog.service';
import { Entrada } from '@app/core/models/entrada.model';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { CommonFunctionalityService } from '@shared/services/common-functionality.service';
import { parseAllowedDate } from '@shared/utils/date-utils';
import { BusquedaService } from '@app/core/services/srv-busqueda/busqueda.service';
import { ToastService } from '@app/core/services/ui/toast.service';
import { ErrorBoundaryService } from '@app/core/errors/error-boundary/error-boundary.service';
import { ErrorBoundaryComponent } from '@shared/components/errors/error-boundary/error-boundary.component';
import { LoggerService } from '@app/core/services/logger.service';
import { Router } from '@angular/router';
import { ListadoEntradasStateService, SearchParams } from './services';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ListadoEntradasComponent implements OnInit, OnDestroy, AfterViewInit {
  entradas$ = this.stateService.entradas$;
  pagingInfo$ = this.stateService.pagingInfo$;
  loading$ = this.stateService.loading$;
  definiciones: any;
  campoSeleccionado: string = '';
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';
  dataOptionSeleccionada: string = 'AND';
  showAdvanced = false;
  basicSearchText = '';
  visible = false;
  entradaABorrar: Entrada | null = null;
  previewEntrada?: Entrada;
  previewVisible: boolean = false;
  @ViewChild('previewCloseBtn') previewCloseBtn?: ElementRef<HTMLButtonElement>;
  private destroy$ = new Subject<void>();
  private readonly boundaryId = 'listado-entradas-main';
  constructor(
    public commonFuncService: CommonFunctionalityService,
    private entradaService: EntradaService,
    private busquedaService: BusquedaService,
    private toastService: ToastService,
    private errorBoundaryService: ErrorBoundaryService,
    private log: LoggerService,
    private router: Router,
    private entradaCatalogService: EntradaCatalogService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private stateService: ListadoEntradasStateService,
    private datePipe: DatePipe
  ) {}
  ngOnInit(): void {
    this.cargarDefinicionesBuscador();
    this.busquedaService.iniciarBusqueda(
      (term, page) => this.realizarBusquedaEntradas(term, page),
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
    this.busquedaService.limpiarBusqueda();
  }
  onBoundaryInit(boundary: ErrorBoundaryComponent): void {
    this.errorBoundaryService.registerBoundary(this.boundaryId, boundary);
  }
  private cargarDefinicionesBuscador(): void {
    this.cdr.markForCheck();
    this.entradaService
      .obtenerDefinicionesBuscadorSafe()
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
    const campos = (this.definiciones.filterKeySegunClazzNamePermitido as string[]) || [];
    const camposOrdenados = [
      ...campos.filter((k) => k === 'titulo'),
      ...campos.filter((k) => k !== 'titulo').sort((a, b) => a.localeCompare(b)),
    ];
    this.campoSeleccionado = camposOrdenados[0] || '';
    const operaciones = this.definiciones.operationPermitido?.[this.campoSeleccionado];
    this.operacionSeleccionada = Array.isArray(operaciones) ? operaciones[0] : '';
    this.valorBusqueda = '';
    if (this.campoSeleccionado && this.operacionSeleccionada) {
      this.zone.run(() =>
        setTimeout(() => this.busquedaService.triggerBusqueda(this.valorBusqueda), 0)
      );
    }
  }
  private realizarBusquedaEntradas(term: string, page?: number): Observable<any> {
    const searchParams: SearchParams = {
      term,
      field: this.campoSeleccionado,
      operation: this.operacionSeleccionada,
      dataOption: this.dataOptionSeleccionada,
    };
    return this.stateService.search(searchParams, page);
  }
  obtenerListaEntradas(page: number): void {
    const searchParams: SearchParams = {
      term: this.valorBusqueda,
      field: this.campoSeleccionado,
      operation: this.operacionSeleccionada,
      dataOption: this.dataOptionSeleccionada,
    };
    this.stateService.goToPage(page, searchParams).subscribe();
  }
  refrescarDatos(): void {
    this.busquedaService.triggerBusqueda(this.valorBusqueda);
  }
  public cargarCatalogosEntrada = (): Observable<{ [key: string]: string[] }> => {
    return this.entradaCatalogService.obtenerCatalogosEntrada();
  };
  onPageSizeChange(size: number): void {
    this.stateService.setPageSize(size).subscribe();
  }
  onNext(): void {
    this.stateService.nextPage().subscribe();
  }
  onPrev(): void {
    this.stateService.prevPage().subscribe();
  }
  public toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }
  public onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text;
    this.campoSeleccionado = 'titulo';
    const operaciones = this.definiciones?.operationPermitido?.['titulo'];
    this.operacionSeleccionada =
      Array.isArray(operaciones) && operaciones.length > 0 ? operaciones[0] : 'CONTAINS';
    this.valorBusqueda = text;
    this.busquedaService.triggerBusqueda(text);
  }
  public aplicarFiltro(filtro: any): void {
    this.campoSeleccionado = filtro.campo;
    this.operacionSeleccionada = filtro.operacion;
    this.valorBusqueda = filtro.valor;
    this.cdr.markForCheck();
    if (this.campoSeleccionado && this.operacionSeleccionada) {
      this.busquedaService.triggerBusqueda(this.valorBusqueda);
    }
  }
  public onFiltroChanged(filtro: any): void {
    this.campoSeleccionado = filtro.campo;
    this.operacionSeleccionada = filtro.operacion;
    this.valorBusqueda = filtro.valor;
  }
  abrirModalEliminar(entrada: Entrada): void {
    this.entradaABorrar = entrada;
    this.visible = true;
    this.cdr.markForCheck();
  }
  borrarEntrada(entrada: Entrada): void {
    this.entradaABorrar = entrada;
    this.visible = true;
    this.cdr.markForCheck();
  }
  confirmarBorrado(): void {
    if (this.entradaABorrar) {
      this.stateService.deleteEntrada(this.entradaABorrar.idEntrada).subscribe({
        next: () => {
          this.entradaABorrar = null;
          this.visible = false;
          this.toastService.showSuccess(
            'La entrada se ha eliminado correctamente.',
            'Entrada eliminada'
          );
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.visible = false;
          this.toastService.showError('Error al eliminar la entrada', 'Error');
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
  openPreview(entrada: Entrada): void {
    this.previewEntrada = entrada;
    this.previewVisible = true;
    setTimeout(() => {
      try {
        this.previewCloseBtn?.nativeElement?.focus();
      } catch {}
    }, 50);
  }

  getPreviewStateColor(entrada?: Entrada): string {
    if (!entrada?.estadoEntrada?.nombre) return 'primary';

    switch (entrada.estadoEntrada.nombre.toUpperCase()) {
      case 'PUBLICADA':
        return 'success';
      case 'NO PUBLICADA':
        return 'danger';
      case 'GUARDADA':
      case 'BORRADOR':
        return 'secondary';
      case 'PENDIENTE REVISION':
        return 'warning';
      case 'EN REVISION':
        return 'info';
      case 'REVISADA':
        return 'primary';
      case 'HISTORICA':
        return 'dark';
      case 'PROGRAMADA':
        return 'info';
      default:
        return 'secondary';
    }
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
