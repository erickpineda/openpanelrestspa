import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { EntradaCatalogService } from '../../../core/services/data/entrada-catalog.service';
import { catchError, Subject, takeUntil, throwError } from 'rxjs';
import { Entrada } from '../../../core/models/entrada.model';
import { EntradaService } from '../../../core/services/data/entrada.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { BusquedaService } from '../../../core/services/srv-busqueda/busqueda.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { ErrorBoundaryService } from '../../../core/errors/error-boundary/error-boundary.service';
import { GlobalErrorHandlerService } from '../../../core/errors/global-error/global-error-handler.service';
import { ErrorBoundaryComponent } from '../../../shared/components/errors/error-boundary/error-boundary.component';
import { LoggerService } from '../../../core/services/logger.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss'],
})
export class ListadoEntradasComponent implements OnInit, OnDestroy {
  listaEntradas: Entrada[] = [];
  entradaABorrar: Entrada | null = null;

  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 20;

  public visible = false;
  private destroy$ = new Subject<void>();

  campoSeleccionado: string = '';
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';
  dataOptionSeleccionada: string = 'AND';

  public definiciones: any;
  public cargando: boolean = false;

  // Para el buscador avanzado genérico
  public cargarCatalogosEntrada = (): Observable<{ [key: string]: string[] }> => {
    return this.entradaCatalogService.obtenerCatalogosEntrada();
  };
private readonly boundaryId = 'listado-entradas-main';
  constructor(
    public commonFuncService: CommonFunctionalityService,
    private entradaService: EntradaService,
    private busquedaService: BusquedaService,
    private toastService: ToastService,
    private errorBoundaryService: ErrorBoundaryService,
    private log: LoggerService,
    private router: Router,
    private entradaCatalogService: EntradaCatalogService
  ) {}

  ngOnInit(): void {
    this.cargarDefinicionesBuscador();
    this.busquedaService.iniciarBusqueda(
      (term, page) => this.realizarBusquedaEntradas(term, page),
      (response) => this.procesarResultadosBusqueda(response)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.errorBoundaryService.unregisterBoundary(this.boundaryId);
    this.busquedaService.limpiarBusqueda();
  }

  private realizarBusquedaEntradas(term: string, page?: number) {
    const searchRequest = {
      dataOption: this.dataOptionSeleccionada,
      searchCriteriaList: [{
        filterKey: this.campoSeleccionado,
        value: term,
        operation: this.operacionSeleccionada,
        clazzName: 'Entrada'
      }]
    };
    const pageToUse = page !== undefined ? page : this.currentPage;
    return this.entradaService.buscarSafe(searchRequest, pageToUse, this.pageSize);
  }

  public aplicarFiltro(filtro: any): void {
    this.campoSeleccionado = filtro.campo;
    this.operacionSeleccionada = filtro.operacion;
    this.valorBusqueda = filtro.valor;
    this.currentPage = 0;
    
    if (this.campoSeleccionado && this.operacionSeleccionada) {
      this.busquedaService.triggerBusqueda(this.valorBusqueda);
    }
  }

  public onFiltroChanged(filtro: any): void {
    // Actualizar el estado interno pero no volver a disparar la búsqueda,
    // ya que el buscador centralizado (BusquedaService) será quien la ejecute.
    this.campoSeleccionado = filtro.campo;
    this.operacionSeleccionada = filtro.operacion;
    this.valorBusqueda = filtro.valor;
    this.currentPage = 0;
  }

  private procesarResultadosBusqueda(response: any) {
    if (response.elements) {
      this.listaEntradas = response.elements || [];
      this.totalPages = response.totalPages;
      this.listaEntradas = this.listaEntradas.map((entrada:Entrada) => ({
        ...entrada,
        categoriasConComas: entrada.categorias?.map(e => e.nombre).join(', ') || ''
      }));
    } else {
      this.listaEntradas = [];
      this.currentPage = 0;
      this.mostrarError('Error en búsqueda: ' + response);
    }
  }

  private cargarDefinicionesBuscador(): void {
    this.cargando = true;
    
    this.entradaService.obtenerDefinicionesBuscadorSafe()
      .pipe(
          takeUntil(this.destroy$),
          catchError((error) => {
            // Reportar al boundary específico
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
          this.cargando = false;
          if (response) {
            this.definiciones = response;
            this.inicializarCamposBusqueda();
          }
        },
        error: (error) => {
          this.cargando = false;
          this.log.error('Error secundario:', error);
        }
      });
  }

   onBoundaryInit(boundary: ErrorBoundaryComponent): void {
    this.errorBoundaryService.registerBoundary(this.boundaryId, boundary);
  }

  private inicializarCamposBusqueda(): void {
    const campos = (this.definiciones.filterKeySegunClazzNamePermitido as string[]) || [];
    
    // Ordenar campos: 'titulo' primero, luego el resto alfabéticamente
    const camposOrdenados = [
      ...campos.filter(k => k === 'titulo'),
      ...campos.filter(k => k !== 'titulo').sort((a, b) => a.localeCompare(b))
    ];
    
    this.campoSeleccionado = camposOrdenados[0] || '';
    const operaciones = this.definiciones.operationPermitido?.[this.campoSeleccionado];
    this.operacionSeleccionada = Array.isArray(operaciones) ? operaciones[0] : '';
    this.valorBusqueda = '';
    this.currentPage = 0;
    
    if (this.campoSeleccionado && this.operacionSeleccionada) {
      this.busquedaService.triggerBusqueda(this.valorBusqueda);
    }
  }

  obtenerListaEntradas(page: number): void {
    this.currentPage = page;
    // Ejecutar la búsqueda inmediatamente a través de BusquedaService para
    // mantener la misma función de búsqueda registrada y evitar carreras.
    this.busquedaService.searchNow(this.valorBusqueda, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.procesarResultadosBusqueda(response),
        error: (error) => this.mostrarError('Error en búsqueda: ' + error)
      });
  }

  checkFechaPublicacion(fechaPublicacion: Date): string {
    return fechaPublicacion
      ? this.commonFuncService.transformaFecha(fechaPublicacion, 'dd/MM/yyyy', false)
      : 'No publicada';
  }

  borrarEntrada(entrada: Entrada): void {
    this.entradaABorrar = entrada;
    this.visible = true;
  }

  confirmarBorrado(): void {
    if (this.entradaABorrar) {
      this.entradaService.borrar(this.entradaABorrar.idEntrada)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.obtenerListaEntradas(this.currentPage);
            this.entradaABorrar = null;
            this.visible = false;
            this.toastService.showSuccess('La entrada se ha eliminado correctamente.', 'Entrada eliminada');
          },
          error: (error) => {
            this.log.error('Error al eliminar la entrada:', error);
            this.visible = false;
            this.mostrarError('Error al eliminar la entrada: ' + error.message);
          }
        });
    }
  }

  private mostrarError(mensaje: string): void {
    this.toastService.showError(mensaje, 'Error');
  }

  toggleModal(): void {
    this.visible = !this.visible;
    if (!this.visible) {
      this.entradaABorrar = null;
    }
  }

  onVisibleModalChange(visible: boolean): void {
    this.visible = visible;
    if (!visible) {
      this.entradaABorrar = null;
    }
  }

  refrescarDatos(): void {
    this.currentPage = 0;
    this.busquedaService.triggerBusqueda(this.valorBusqueda);
  }

  // Preview handling
  public previewEntrada?: Entrada;
  public previewVisible: boolean = false;

  openPreview(entrada: Entrada): void {
    this.previewEntrada = entrada;
    this.previewVisible = true;
    // Dar foco al botón de cerrar del modal para accesibilidad (delay corto
    // para esperar a que el modal se renderice).
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
  }

  onPreviewVisibleChange(visible: boolean): void {
    this.previewVisible = visible;
    if (!visible) this.previewEntrada = undefined;
  }

  onEditarDesdePreview(): void {
    if (this.previewEntrada && this.previewEntrada.idEntrada) {
      // Navegar a la ruta de edición
      this.router.navigate(['/admin/control/entradas/editar', this.previewEntrada.idEntrada]);
      this.closePreview();
    }
  }

  onPublicarDesdePreview(entrada: Entrada): void {
    // Si existe un endpoint para publicar, se llamaría aquí. Por ahora, cerramos la preview
    // y mostramos un toast informativo.
    this.closePreview();
    this.toastService.showInfo('Solicitud de publicación enviada (acción no implementada).', 'Publicar');
  }

  @ViewChild('previewCloseBtn') previewCloseBtn?: ElementRef<HTMLButtonElement>;

  // Método para trackBy en *ngFor (mejora rendimiento)
  trackByEntradaId(index: number, entrada: Entrada): number {
    return entrada.idEntrada;
  }
}