import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { Entrada } from '../../../core/models/entrada.model';
import { EntradaService } from '../../../core/services/data/entrada.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { SearchUtilService } from '../../../core/services/utils/search-util.service';
import { BusquedaService } from '../../../core/services/srv-busqueda/busqueda.service';
import { ToastService } from '../../../core/services/ui/toast.service';
import { BatchLoadingService } from '../../../core/services/ui/batch-loading.service';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss']
})
export class ListadoEntradasComponent implements OnInit, OnDestroy  {
  listaEntradas: Entrada[] = [];
  entradaABorrar: Entrada | null = null;

  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 20;

  public visible = false;
  public toastVisible = false;
  public loading: boolean = false;

  private destroy$ = new Subject<void>();

  campoSeleccionado: string = '';
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';
  dataOptionSeleccionada: string = 'AND';

  public definiciones: any;

  private currentBatchId?: number;

  constructor(
    public commonFuncService: CommonFunctionalityService,
    private entradaService: EntradaService,
    private searchUtilService: SearchUtilService,
    private busquedaService: BusquedaService,
    private toastService: ToastService,
    private batchLoadingService: BatchLoadingService,
  ) {}

  ngOnInit(): void {
    this.currentBatchId = this.batchLoadingService.startBatch();
    try {
      this.cargarDefinicionesBuscador();
      this.busquedaService.iniciarBusqueda(
        (term) => this.realizarBusquedaEntradas(term),
        (response) => this.procesarResultadosBusqueda(response)
      );
    } finally {
      this.batchLoadingService.endBatch(this.currentBatchId!);
    }
  }

  ngOnDestroy(): void {
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
    this.mostrarLoader();
    if (this.campoSeleccionado && this.operacionSeleccionada) {
      this.busquedaService.triggerBusqueda(this.valorBusqueda);
    }
  }

  private procesarResultadosBusqueda(response: any) {
    this.ocultarLoader();
    if (response.result?.success) {
      this.listaEntradas = response.data.elements || [];
      this.totalPages = response.data.totalPages;
      this.listaEntradas = this.listaEntradas.map(entrada => ({
        ...entrada,
        categoriasConComas: entrada.categorias?.map(e => e.nombre).join(', ') || ''
      }));
    } else {
      console.error('Error en búsqueda:', response.error);
      this.listaEntradas = [];
      this.currentPage = 0;
      this.msgToast('Error en búsqueda: ' + response.error);
    }
  }

  private cargarDefinicionesBuscador(): void {
    this.mostrarLoader();
    this.entradaService.obtenerDefinicionesBuscador().subscribe({
      next: (response) => {
        if (response.result?.success) {
          this.definiciones = response.data;
          const campos = (this.definiciones.filterKeySegunClazzNamePermitido as string[]);
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
        this.ocultarLoader();
      },
      error: (error) => {
        console.error('Error al cargar definiciones del buscador:', error);
        this.ocultarLoader();
        this.msgToast(error.error?.error?.message);
      }
    });
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

  crearEntrada() {}

  actualizarEntrada(id: number) {}

  borrarEntrada(id: number): void {
    this.entradaABorrar = this.listaEntradas.find((entr) => entr.idEntrada === id) || null;
    this.visible = true;
  }

  confirmarBorrado(): void {
    if (this.entradaABorrar) {
      this.entradaService.borrar(this.entradaABorrar.idEntrada).subscribe({
        next: (response) => {
          console.log('Entrada eliminada:', response);
          this.obtenerListaEntradas(this.currentPage);
          this.entradaABorrar = null;
          this.visible = false;
          this.mostrarToast();
        },
        error: (err) => {
          console.error('Error al eliminar la entrada:', err);
          this.visible = false;
          this.msgToast('Error al eliminar la entrada: ' + err);
        }
      });
    }
  }

  mostrarToast(): void {
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 5000);
  }

  private msgToast(str: any) {
    this.toastService.showError(str, 'Error');
  }

  toggleModal() {
    this.visible = !this.visible;
  }

  visibleModal(event: any) {
    this.visible = event;
  }

  private mostrarLoader(): void {
    this.loading = true;
  }

  private ocultarLoader(): void {
    this.loading = false;
  }

  public refrescarPagina(): void {
    window.location.reload();
  }
}
