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
import { Observable, of } from 'rxjs';
import { EntradaCatalogService } from '../../../core/services/data/entrada-catalog.service';
import { catchError, Subject, takeUntil, throwError, finalize } from 'rxjs';
import { Entrada } from '../../../core/models/entrada.model';
import { EntradaService } from '../../../core/services/data/entrada.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { parseAllowedDate } from '../../../shared/utils/date-utils';
import { BusquedaService } from '../../../core/services/srv-busqueda/busqueda.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { ErrorBoundaryService } from '../../../core/errors/error-boundary/error-boundary.service';
import { ErrorBoundaryComponent } from '../../../shared/components/errors/error-boundary/error-boundary.component';
import { LoggerService } from '../../../core/services/logger.service';
import { Router } from '@angular/router';
import { ListadoEntradasStateService, SearchParams } from './services/listado-entradas-state.service';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ListadoEntradasComponent implements OnInit, OnDestroy, AfterViewInit {
  // #region Properties

  // Data (Managed by State Service)
  entradas$ = this.stateService.entradas$;
  pagingInfo$ = this.stateService.pagingInfo$;
  loading$ = this.stateService.loading$;
  
  definiciones: any;

  // Search & Filters
  campoSeleccionado: string = '';
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';
  dataOptionSeleccionada: string = 'AND';
  showAdvanced = false;
  basicSearchText = '';

  // UI State
  visible = false; // Modal borrado
  entradaABorrar: Entrada | null = null;

  // Preview State
  previewEntrada?: Entrada;
  previewVisible: boolean = false;
  @ViewChild('previewCloseBtn') previewCloseBtn?: ElementRef<HTMLButtonElement>;

  // System
  private destroy$ = new Subject<void>();
  private readonly boundaryId = 'listado-entradas-main';

  // #endregion

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

  // #region Lifecycle Methods

  ngOnInit(): void {
    this.cargarDefinicionesBuscador();
    this.busquedaService.iniciarBusqueda(
      (term, page) => this.realizarBusquedaEntradas(term, page),
      () => {} // No-op, data flows through observables
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

  // #endregion

  // #region Data Loading & Search

  private cargarDefinicionesBuscador(): void {
    this.cdr.markForCheck();

    this.entradaService
      .obtenerDefinicionesBuscadorSafe()
      .pipe(
        takeUntil(this.destroy$),
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

    // Ordenar campos: 'titulo' primero, luego el resto alfabéticamente
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
      dataOption: this.dataOptionSeleccionada
    };
    
    // Retornamos el observable para que BusquedaService lo maneje (switchMap)
    return this.stateService.search(searchParams, page);
  }

  obtenerListaEntradas(page: number): void {
    const searchParams: SearchParams = {
      term: this.valorBusqueda,
      field: this.campoSeleccionado,
      operation: this.operacionSeleccionada,
      dataOption: this.dataOptionSeleccionada
    };
    this.stateService.goToPage(page, searchParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  refrescarDatos(): void {
    this.busquedaService.triggerBusqueda(this.valorBusqueda);
  }

  public cargarCatalogosEntrada = (): Observable<{
    [key: string]: string[];
  }> => {
    return this.entradaCatalogService.obtenerCatalogosEntrada();
  };

  // #endregion

  // #region Pagination
  
  onPageSizeChange(size: number): void {
    this.stateService.setPageSize(size)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  onNext(): void {
    this.stateService.nextPage()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  onPrev(): void {
    this.stateService.prevPage()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  // #endregion

  // #region Filter & Search Actions

  public toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  public onBasicSearchTextChange(text: string): void {
    this.basicSearchText = text;
    this.campoSeleccionado = 'titulo';

    // Intentar obtener operación válida para título, por defecto CONTAINS
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
    // Actualizar el estado interno pero no volver a disparar la búsqueda
    this.campoSeleccionado = filtro.campo;
    this.operacionSeleccionada = filtro.operacion;
    this.valorBusqueda = filtro.valor;
  }

  // #endregion

  // #region CRUD Actions (Delete)

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
      this.stateService
        .deleteEntrada(this.entradaABorrar.idEntrada)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
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
            this.mostrarError('Error al eliminar la entrada: ' + error.message);
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

  // #endregion

  // #region Preview Modal

  openPreview(entrada: Entrada): void {
    this.previewEntrada = entrada;
    this.previewVisible = true;
    // Dar foco al botón de cerrar del modal para accesibilidad
    setTimeout(() => {
      try {
        this.previewCloseBtn?.nativeElement?.focus();
      } catch (e) {
        // ignorar si no está disponible
      }
    }, 50);
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
      // 1. Cerrar el modal primero para iniciar la limpieza del backdrop
      this.closePreview();

      // 2. Navegar con un pequeño retraso para asegurar que el modal se ha desmontado/cerrado correctamente
      // Esto previene que el backdrop se quede "huérfano" si el componente se destruye muy rápido
      setTimeout(() => {
        this.router.navigate(['/admin/control/entradas/editar', idEntrada]);
      }, 350);
    }
  }

  onPublicarDesdePreview(entrada: Entrada): void {
    this.closePreview();
    this.toastService.showInfo(
      'Solicitud de publicación enviada (acción no implementada).',
      'Publicar'
    );
  }

  // #endregion

  // #region Helpers

  checkFechaPublicacion(fechaPublicacion: any): string {
    const date = parseAllowedDate(fechaPublicacion);
    return date
      ? this.datePipe.transform(date, 'dd-MM-yyyy') || ''
      : 'No publicada';
  }

  getFechaDate(fecha: any): Date | null {
    return parseAllowedDate(fecha);
  }

  private mostrarError(mensaje: string): void {
    this.toastService.showError(mensaje, 'Error');
    this.cdr.markForCheck();
  }

  // #endregion
}
