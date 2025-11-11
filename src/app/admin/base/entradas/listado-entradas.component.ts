import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Entrada } from '../../../core/models/entrada.model';
import { EntradaService } from '../../../core/services/data/entrada.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { BusquedaService } from '../../../core/services/srv-busqueda/busqueda.service';
import { ToastService } from '../../../core/services/ui/toast.service';

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

  constructor(
    public commonFuncService: CommonFunctionalityService,
    private entradaService: EntradaService,
    private busquedaService: BusquedaService,
    private toastService: ToastService,
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
    return this.entradaService.buscar(searchRequest, this.currentPage, this.pageSize);
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
    if (response.result?.success) {
      this.listaEntradas = response.data.elements || [];
      this.totalPages = response.data.totalPages;
      this.listaEntradas = this.listaEntradas.map((entrada:Entrada) => ({
        ...entrada,
        categoriasConComas: entrada.categorias?.map(e => e.nombre).join(', ') || ''
      }));
    } else {
      console.error('Error en búsqueda:', response.error);
      this.listaEntradas = [];
      this.currentPage = 0;
      this.mostrarError('Error en búsqueda: ' + response.error);
    }
  }

  private cargarDefinicionesBuscador(): void {
    this.cargando = true;
    
    this.entradaService.obtenerDefinicionesBuscador()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cargando = false;
          if (response.result?.success) {
            this.definiciones = response.data;
            this.inicializarCamposBusqueda();
          }
        },
        error: (error) => {
          this.cargando = false;
          console.error('Error al cargar definiciones del buscador:', error);
          this.mostrarError(error.error?.error?.message || 'Error al cargar definiciones');
        }
      });
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
            console.log('Entrada eliminada:', response);
            this.obtenerListaEntradas(this.currentPage);
            this.entradaABorrar = null;
            this.visible = false;
            this.toastService.showSuccess('La entrada se ha eliminado correctamente.', 'Entrada eliminada');
          },
          error: (error) => {
            console.error('Error al eliminar la entrada:', error);
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