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

  private definiciones: any;

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
          this.definiciones = response.data;
          const campos = (this.definiciones.filterKeySegunClazzNamePermitido as string[]);

          // Ordenar alfabéticamente, pero asegurando que "titulo" esté al principio
          const camposOrdenados = [
            ...campos.filter(k => k === 'titulo'),
            ...campos.filter(k => k !== 'titulo').sort((a, b) => a.localeCompare(b))
          ];

          // Campos disponibles para filtros
          this.camposDisponibles = camposOrdenados.map((key: string) => ({
            nombre: this.traducirCampo(key),
            valor: key
          }));

          // Clases disponibles
          this.clazzesDisponibles = this.definiciones.clazzNamePermitido.map((clazzName: string) => ({
            nombre: clazzName,
            valor: clazzName
          }));

          this.campoSeleccionado = this.camposDisponibles[0]?.valor || '';
          this.actualizarOperacionesDisponibles();
        }
      },
      error: (error) => {
        console.error('Error al cargar definiciones del buscador:', error);
      }
    });
  }

  public actualizarOperacionesDisponibles(): void {
    if (
      !this.definiciones ||
      !this.definiciones.operationPermitido ||
      !this.campoSeleccionado ||
      !this.definiciones.operationPermitido[this.campoSeleccionado]
    ) {
      this.operacionesDisponibles = [];
      this.operacionSeleccionada = '';
      return;
    }

    const operacionesCampo = (this.definiciones.operationPermitido[this.campoSeleccionado] as string[] || [])
      .map((op: string) => ({
        nombre: this.traducirOperacion(op),
        valor: op
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    this.operacionesDisponibles = operacionesCampo;
    this.operacionSeleccionada = this.operacionesDisponibles[0]?.valor || '';
  }

  // Ejemplo de método para traducir operaciones (puedes expandirlo)
  private traducirOperacion(op: string): string {
    const traducciones: { [key: string]: string } = {
      'CONTAINS': 'Contiene',
      'DOES_NOT_CONTAIN': 'No contiene',
      'EQUAL': 'Igual a',
      'NOT_EQUAL': 'Distinto de',
      'BEGINS_WITH': 'Comienza con',
      'DOES_NOT_BEGIN_WITH': 'No comienza con',
      'ENDS_WITH': 'Termina con',
      'DOES_NOT_END_WITH': 'No termina con',
      'NULL': 'Vacío',
      'NOT_NULL': 'No vacío',
      'GREATER_THAN': 'Mayor que',
      'GREATER_THAN_EQUAL': 'Mayor o igual que',
      'LESS_THAN': 'Menor que',
      'LESS_THAN_EQUAL': 'Menor o igual que'
    };
    return traducciones[op] || op;
  }

  private traducirCampo(campo: string): string {
    const traducciones: { [key: string]: string } = {
      'titulo': 'Título',
      'estadoEntrada.nombre': 'Estado',
      'tipoEntrada.nombre': 'Tipo',
      'usernameCreador': 'Usuario creador',
      'usernameModificador': 'Usuario modificador',
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