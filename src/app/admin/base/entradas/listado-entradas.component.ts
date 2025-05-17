import { Component, OnDestroy, OnInit } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';
import { Entrada } from '../../../core/models/entrada.model';
import { Usuario } from '../../../core/models/usuario.model';
import { EntradaService } from '../../../core/services/entrada.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { OpenpanelApiResponse } from '../../../core/models/openpanel-api-response.model';
import { SearchUtilService } from '../../../core/services/search-util.service';
import { BusquedaService } from '../../../core/services/srv-busqueda/busqueda.service';

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

  private destroy$ = new Subject<void>();

  // Campos para el filtro
  camposDisponibles = [
    { nombre: 'Título', valor: 'titulo' },
    { nombre: 'Categorías', valor: 'categoriasConComas' },
    { nombre: 'Usuario', valor: 'idUsuario' }
  ];

  clazzesDisponibles = [
    { nombre: 'Entrada'},
    { nombre: 'Categoria' },
    { nombre: 'Usuario' }
  ];

  operacionesDisponibles: { nombre: string; valor: string }[] = [];
  campoSeleccionado: string = this.camposDisponibles[0].valor;
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';
  dataOptionSeleccionada: string = 'AND';

  combinacionesDisponibles = ['AND', 'OR'];

  constructor(
    public commonFuncService: CommonFunctionalityService,
    private entradaService: EntradaService,
    private searchUtilService: SearchUtilService,
    private busquedaService: BusquedaService,
  ) {}

  ngOnInit(): void {
    // Cargar operaciones disponibles desde el servicio
    this.operacionesDisponibles = this.searchUtilService.getOperacionesDisponibles();
    this.operacionSeleccionada = this.operacionesDisponibles[0].valor;

    // Configurar servicio solo una vez
    this.busquedaService.iniciarBusqueda(
      (term) => this.realizarBusquedaEntradas(term),
      (response) => this.procesarResultadosBusqueda(response)
    );
    
    // Búsqueda inicial
    this.busquedaService.triggerBusqueda('');
  }

  ngOnDestroy(): void {
    this.busquedaService.limpiarBusqueda();
  }

  private realizarBusquedaInicial(): void {
    const searchRequest = {
      dataOption: this.dataOptionSeleccionada,
      searchCriteriaList: [{
        filterKey: this.campoSeleccionado,
        value: '', // Término vacío para obtener todos los registros
        operation: this.operacionSeleccionada,
        clazzName: this.clazzesDisponibles[0].nombre ||  this.clazzesDisponibles[1].nombre || this.clazzesDisponibles[2].nombre
      }]
    };

    this.entradaService.buscar(searchRequest, this.currentPage, this.pageSize).subscribe({
      next: (response) => this.procesarResultadosBusqueda(response),
      error: (err) => console.error('Error en búsqueda inicial:', err)
    });
  }

  private realizarBusquedaEntradas(term: string) {
    const searchRequest = {
      dataOption: this.dataOptionSeleccionada,
      searchCriteriaList: [{
        filterKey: this.campoSeleccionado,
        value: term,
        operation: this.operacionSeleccionada,
        clazzName: (this.campoSeleccionado=='idUsuario')? 'Usuario': this.clazzesDisponibles[0].nombre
      }]
    };console.log(this.campoSeleccionado);
    return this.entradaService.buscar(searchRequest, this.currentPage, this.pageSize);
  }

  private procesarResultadosBusqueda(response: any) {
    if (response.result?.success) {
      this.listaEntradas = response.data.elements || [];
      this.totalPages = response.data.totalPages;
      
      // Procesar categorías si es necesario
      this.listaEntradas = this.listaEntradas.map(entrada => ({
        ...entrada,
        categoriasConComas: entrada.categorias?.map(e => e.nombre).join(', ') || ''
      }));
    } else {
      console.error('Error en búsqueda:', response.error);
      this.listaEntradas = [];
      this.operacionesDisponibles = this.searchUtilService.getOperacionesDisponibles();
      this.operacionSeleccionada = this.operacionesDisponibles[0].valor;
    }
  }

  onInputChange(): void {
    this.busquedaService.triggerBusqueda(this.valorBusqueda);
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
    this.visible = true; // Mostrar el modal
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
        }
      });
    }
  }

  mostrarToast(): void {
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 3000); // Ocultar el toast después de 3 segundos
  }

  toggleModal() {
    this.visible = !this.visible;
  }

  visibleModal(event: any) {
    this.visible = event;
  }

  public refrescarPagina(): void {
    window.location.reload();
  }
}