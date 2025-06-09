import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { Entrada } from '../../../core/models/entrada.model';
import { EntradaService } from '../../../core/services/entrada.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
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
  ];

  clazzesDisponibles = [
    { nombre: 'Entrada', valor: 'titulo' },
  ];

  operacionesDisponibles: any;
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
    // Cargar definiciones disponibles desde el servicio
    this.cargarDefinicionesBuscador();

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

  private realizarBusquedaEntradas(term: string) {
    const searchRequest = {
      dataOption: this.dataOptionSeleccionada,
      searchCriteriaList: [{
        filterKey: this.campoSeleccionado,
        value: term,
        operation: this.operacionSeleccionada,
        clazzName: this.obtenerNombreClase(this.campoSeleccionado)
      }]
    };
    return this.entradaService.buscar(searchRequest, this.currentPage, this.pageSize);
  }

  private obtenerNombreClase(filterKey: string): string {
    const match = this.clazzesDisponibles.find(clazz => clazz.valor === filterKey);
    return match ? match.nombre : 'Entrada';
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
      this.currentPage = 0;
    }
  }

  private cargarDefinicionesBuscador(): void {
    this.entradaService.obtenerDefinicionesBuscador().subscribe({
      next: (response) => {
        if (response.result?.success) {
          const definiciones = response.data;

          // Campos disponibles para filtros
          this.camposDisponibles = definiciones.filterKeySegunClazzNamePermitido.map((key: string) => ({
            nombre: this.traducirCampo(key),
            valor: key
          }));

          // Clases disponibles
          this.clazzesDisponibles = definiciones.clazzNamePermitido.map((clazzName: string) => ({
            nombre: clazzName,
            valor: clazzName
          }));

          // Operaciones disponibles
          this.operacionesDisponibles = Object.entries(definiciones.operationPermitido).map(([key, value]) => ({
            nombre: value,
            valor: key
          }));

          this.operacionSeleccionada = this.operacionesDisponibles[0]?.valor || '';
        }
      },
      error: (error) => {
        console.error('Error al cargar definiciones del buscador:', error);
      }
    });
  }

  private traducirCampo(campo: string): string {
    const traducciones: { [key: string]: string } = {
      'titulo': 'Título',
      'estadoEntrada.nombre': 'Estado',
      'tipoEntrada.nombre': 'Tipo',
      'usuario.username': 'Usuario',
      'categorias.nombre': 'Categoria',
      'etiquetas.nombre': 'Etiqueta',
    };
    return traducciones[campo] || campo;
  }

  onInputChange(): void {
    this.currentPage = (this.currentPage > 0) ? 0 : this.currentPage;
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