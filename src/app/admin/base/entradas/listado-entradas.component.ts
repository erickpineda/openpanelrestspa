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
import { Observable } from 'rxjs';
import { EntradaCatalogService } from '../../../core/services/data/entrada-catalog.service';
import { catchError, Subject, takeUntil, throwError, finalize } from 'rxjs';
import { Entrada } from '../../../core/models/entrada.model';
import { EntradaService } from '../../../core/services/data/entrada.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { BusquedaService } from '../../../core/services/srv-busqueda/busqueda.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { ErrorBoundaryService } from '../../../core/errors/error-boundary/error-boundary.service';
import { ErrorBoundaryComponent } from '../../../shared/components/errors/error-boundary/error-boundary.component';
import { LoggerService } from '../../../core/services/logger.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ListadoEntradasComponent implements OnInit, OnDestroy, AfterViewInit {
  // #region Properties

  // Data
  listaEntradas: Entrada[] = [];
  allEntradas: Entrada[] = []; // Fallback client-side
  definiciones: any;

  // Paging & Stats
  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 20;
  totalElements = 0;
  numberOfElements = 0;
  estaVacio: boolean = false;

  // Search & Filters
  campoSeleccionado: string = '';
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';
  dataOptionSeleccionada: string = 'AND';
  showAdvanced = false;
  basicSearchText = '';

  // UI State
  cargando: boolean = false;
  cargandoTabla: boolean = false;
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
    private zone: NgZone
  ) {}

  // #region Lifecycle Methods

  ngOnInit(): void {
    this.cargarDefinicionesBuscador();
    this.busquedaService.iniciarBusqueda(
      (term, page) => this.realizarBusquedaEntradas(term, page),
      (response) => this.procesarResultadosBusqueda(response)
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
    this.cargando = true;
    this.cdr.markForCheck();

    this.entradaService
      .obtenerDefinicionesBuscadorSafe()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargando = false;
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
    this.currentPage = 0;

    if (this.campoSeleccionado && this.operacionSeleccionada) {
      this.zone.run(() =>
        setTimeout(() => this.busquedaService.triggerBusqueda(this.valorBusqueda), 0)
      );
    }
  }

  private realizarBusquedaEntradas(term: string, page?: number) {
    this.cargandoTabla = true;
    this.cdr.markForCheck();
    const searchRequest = {
      dataOption: this.dataOptionSeleccionada,
      searchCriteriaList: [
        {
          filterKey: this.campoSeleccionado,
          value: term,
          operation: this.operacionSeleccionada,
          clazzName: 'Entrada',
        },
      ],
    };
    const pageToUse = page !== undefined ? page : this.currentPage;
    return this.entradaService.buscarSafe(searchRequest, pageToUse, this.pageSize).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.cargandoTabla = false;
        this.cdr.detectChanges();
      })
    );
  }

  private procesarResultadosBusqueda(response: any) {
    this.setPageData(response);
  }

  private setPageData(data: any): void {
    const raw =
      data?.elements ??
      (data as any)?.items ??
      (data as any)?.content ??
      (Array.isArray(data) ? data : []);
    let elementos: Entrada[] = Array.isArray(raw) ? raw : [];

    // Mapear categorías
    elementos = elementos.map((entrada: Entrada) => ({
      ...entrada,
      categoriasConComas: entrada.categorias?.map((e) => e.nombre).join(', ') || '',
    }));

    const hasServerPaging =
      typeof data?.totalPages === 'number' || typeof data?.totalElements === 'number';

    if (hasServerPaging) {
      this.listaEntradas = elementos;
      this.totalElements = Number(data.totalElements || elementos.length || 0);
      this.totalPages = Number(
        data.totalPages || Math.ceil(this.totalElements / this.pageSize) || 1
      );
      this.numberOfElements = Number(data.numberOfElements ?? elementos.length);
      this.estaVacio = elementos.length === 0;
      this.allEntradas = []; // Limpiar caché cliente si es server paging

      // Boundary check
      if (elementos.length === 0 && this.currentPage > 0 && this.currentPage >= this.totalPages) {
        this.currentPage = Math.max(0, this.totalPages - 1);
        this.busquedaService.triggerBusqueda(this.valorBusqueda);
        return;
      }
    } else {
      // Fallback Client Paging
      this.allEntradas = elementos;
      this.totalElements = this.allEntradas.length;
      this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));
      this.estaVacio = this.totalElements === 0;

      if (this.currentPage >= this.totalPages) {
        this.currentPage = Math.max(0, this.totalPages - 1);
      }
      this.applyPaging();
    }
    this.cdr.markForCheck();
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  obtenerListaEntradas(page: number): void {
    this.currentPage = page;

    if (this.allEntradas.length > 0) {
      // Paginación cliente
      this.applyPaging();
    } else {
      // Paginación servidor
      this.busquedaService
        .searchNow(this.valorBusqueda, this.currentPage)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => this.procesarResultadosBusqueda(response),
          error: (error) => this.mostrarError('Error en búsqueda: ' + error),
        });
    }
    this.cdr.markForCheck();
  }

  refrescarDatos(): void {
    this.currentPage = 0;
    this.busquedaService.triggerBusqueda(this.valorBusqueda);
  }

  public cargarCatalogosEntrada = (): Observable<{
    [key: string]: string[];
  }> => {
    return this.entradaCatalogService.obtenerCatalogosEntrada();
  };

  // #endregion

  // #region Pagination

  private applyPaging(): void {
    if (this.allEntradas.length > 0) {
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.listaEntradas = this.allEntradas.slice(start, end);
      this.numberOfElements = this.listaEntradas.length;
    } else {
      if (this.allEntradas.length === 0 && !this.estaVacio) {
        // Si allEntradas está vacío pero no es porque no haya resultados, sino porque estamos en server paging, no hacemos nada aquí.
      } else if (this.allEntradas.length > 0) {
        // Caso redundante pero por seguridad
        this.listaEntradas = [];
        this.numberOfElements = 0;
      }
    }
    this.cdr.markForCheck();
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  public onPageSizeChange(size: number): void {
    this.pageSize = Number(size) || 20;
    this.currentPage = 0;
    // Forzar recarga
    if (this.allEntradas.length > 0) {
      // Si estamos en modo cliente, solo reaplicar paginación
      this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));
      this.applyPaging();
    } else {
      this.busquedaService.triggerBusqueda(this.valorBusqueda);
    }
  }

  onPrev(): void {
    if (this.currentPage > 0) {
      this.obtenerListaEntradas(this.currentPage - 1);
    }
  }

  onNext(): void {
    if (this.currentPage < Math.max(0, this.totalPages - 1)) {
      this.obtenerListaEntradas(this.currentPage + 1);
    }
  }

  isNextDisabled(): boolean {
    return this.currentPage >= Math.max(0, this.totalPages - 1);
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
    this.currentPage = 0;
    this.busquedaService.triggerBusqueda(text);
  }

  public aplicarFiltro(filtro: any): void {
    this.campoSeleccionado = filtro.campo;
    this.operacionSeleccionada = filtro.operacion;
    this.valorBusqueda = filtro.valor;
    this.currentPage = 0;
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
    this.currentPage = 0;
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
      this.entradaService
        .borrar(this.entradaABorrar.idEntrada)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.obtenerListaEntradas(this.currentPage);
            this.entradaABorrar = null;
            this.visible = false;
            this.toastService.showSuccess(
              'La entrada se ha eliminado correctamente.',
              'Entrada eliminada'
            );
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.log.error('Error al eliminar la entrada:', error);
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
    this.previewEntrada = undefined;
    this.cdr.markForCheck();
  }

  onPreviewVisibleChange(visible: boolean): void {
    this.previewVisible = visible;
    if (!visible) this.previewEntrada = undefined;
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
    const date = this.getFechaDate(fechaPublicacion);
    return date
      ? this.commonFuncService.transformaFecha(date, 'dd-MM-yyyy', true)
      : 'No publicada';
  }

  getFechaDate(fecha: any): Date | null {
    if (!fecha) return null;
    
    // Si ya es un objeto Date, verificar que sea válido
    if (fecha instanceof Date) {
      return !isNaN(fecha.getTime()) ? fecha : null;
    }
    
    // Si es string "dd-MM-yyyy HH:mm:ss" o "dd-MM-yyyy"
    if (typeof fecha === 'string') {
      // Intentar parsing directo primero (ISO)
      let d = new Date(fecha);
      if (!isNaN(d.getTime())) return d;

      // Intentar formato español dd-MM-yyyy
      const parts = fecha.split(' ');
      const dateParts = parts[0].split('-');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        
        let hour = 0, min = 0, sec = 0;
        if (parts.length > 1) {
          const timeParts = parts[1].split(':');
          hour = parseInt(timeParts[0], 10) || 0;
          min = parseInt(timeParts[1], 10) || 0;
          sec = parseInt(timeParts[2], 10) || 0;
        }
        
        d = new Date(year, month, day, hour, min, sec);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return null;
  }

  getEstadoInfo(entrada: Entrada): {
    icon: string;
    color: string;
    tooltip: string;
  } {
    if (entrada.publicada) {
      return {
        icon: 'cilCheckCircle',
        color: 'text-success',
        tooltip: 'Publicada',
      };
    }
    if (entrada.borrador) {
      return { icon: 'cilFile', color: 'text-warning', tooltip: 'Borrador' };
    }
    return {
      icon: 'cilHistory',
      color: 'text-warning',
      tooltip: entrada.estadoEntrada?.nombre || 'Pendiente',
    };
  }

  trackByEntradaId(index: number, entrada: Entrada): number {
    return entrada.idEntrada;
  }

  private mostrarError(mensaje: string): void {
    this.toastService.showError(mensaje, 'Error');
    this.cdr.markForCheck();
  }

  // #endregion
}
