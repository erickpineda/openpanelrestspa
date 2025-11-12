import { Component, OnDestroy, OnInit } from '@angular/core';
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
private readonly boundaryId = 'listado-entradas-main';
  constructor(
    public commonFuncService: CommonFunctionalityService,
    private entradaService: EntradaService,
    private busquedaService: BusquedaService,
    private toastService: ToastService,private errorBoundaryService: ErrorBoundaryService,
    private log: LoggerService
  ) {}

  ngOnInit(): void {
    this.cargarDefinicionesBuscador();
    this.busquedaService.iniciarBusqueda(
      (term) => this.realizarBusquedaEntradas(term),
      (response) => this.procesarResultadosBusqueda(response)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.errorBoundaryService.unregisterBoundary(this.boundaryId);
    this.busquedaService.limpiarBusqueda();
  }

  private realizarBusquedaEntradas(term: string) {
    const searchRequest = {
      dataOption: this.dataOptionSeleccionada,
      searchCriteriaList: [{
        filterKey: this.campoSeleccionado,
        value: term,
        operation: this.operacionSeleccionada,
        clazzName: 'Entrada'
      }]
    };
    return this.entradaService.buscarSafe(searchRequest, this.currentPage, this.pageSize);
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
    this.busquedaService.triggerBusqueda(this.valorBusqueda);
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

  // Método para trackBy en *ngFor (mejora rendimiento)
  trackByEntradaId(index: number, entrada: Entrada): number {
    return entrada.idEntrada;
  }
}