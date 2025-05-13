import { Component, OnInit } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';
import { Entrada } from '../../../core/models/entrada.model';
import { Usuario } from '../../../core/models/usuario.model';
import { EntradaService } from '../../../core/services/entrada.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { CommonFunctionalityService } from '../../../shared/services/common-functionality.service';
import { OpenpanelApiResponse } from '../../../core/models/openpanel-api-response.model';
import { SearchUtilService } from '../../../core/services/search-util.service';

@Component({
  selector: 'app-listado-entradas',
  templateUrl: './listado-entradas.component.html',
  styleUrls: ['./listado-entradas.component.scss']
})
export class ListadoEntradasComponent implements OnInit {
  entrada: Entrada = new Entrada();
  listaEntradas: Entrada[] = [];
  entradaABorrar: Entrada | null = null;

  totalPages: number = 0;
  currentPage: number = 0;
  pageSize: number = 20;

  public visible = false;
  public toastVisible = false;

  searchTerm: string = '';
  private searchSubject: Subject<void> = new Subject();

  // Campos disponibles para el filtro
  camposDisponibles = [
    { nombre: 'Título', valor: 'titulo' },
    { nombre: 'Categorías', valor: 'categoriasConComas' },
    { nombre: 'Usuario', valor: 'username' }
  ];

  operacionesDisponibles: { nombre: string; valor: string }[] = [];
  campoSeleccionado: string = this.camposDisponibles[0].valor;
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';
  dataOptionSeleccionada: string = 'AND'; // Por defecto usamos AND

  // Opciones para combinar criterios
  combinacionesDisponibles = ['AND', 'OR'];

  constructor(
    public commonFuncService: CommonFunctionalityService,
    private entradaService: EntradaService,
    private usuarioService: UsuarioService,
    private searchUtilService: SearchUtilService
  ) {}

  ngOnInit(): void {
    this.obtenerListaEntradas(this.currentPage);

    // Cargar operaciones disponibles desde el servicio
    this.operacionesDisponibles = this.searchUtilService.getOperacionesDisponibles();
    this.operacionSeleccionada = this.operacionesDisponibles[0].valor;

    // Configurar debounce para la búsqueda
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.buscarEntradas();
    });
  }

  buscarEntradas(): void {
    // Construir el objeto de la solicitud
    const searchRequest = {
      dataOption: this.dataOptionSeleccionada,
      searchCriteriaList: [
        {
          filterKey: this.campoSeleccionado,
          value: this.valorBusqueda,
          operation: this.operacionSeleccionada,
          clazzName: 'Entrada' // Clase asociada al filtro
        }
      ]
    };

    // Llamar al servicio con los criterios de búsqueda
    this.entradaService.buscar(searchRequest, this.currentPage, this.pageSize).subscribe({
      next: (response: OpenpanelApiResponse<any>) => {
        this.listaEntradas = response.data.elements || [];
      },
      error: (err) => {
        console.error('Error al buscar entradas:', err);
        this.listaEntradas = [];
      }
    });
  }

  onInputChange(): void {
    this.searchSubject.next();
  }

  obtenerListaEntradas(page: number): void {
    this.currentPage = page;

    // Construir el objeto de la solicitud
    const searchRequest = {
      dataOption: this.dataOptionSeleccionada,
      searchCriteriaList: [
        {
          filterKey: this.campoSeleccionado,
          value: this.valorBusqueda,
          operation: this.operacionSeleccionada || 'cn',
          clazzName: 'Entrada' // Clase asociada al filtro
        }
      ]
    };

    this.entradaService.buscar(searchRequest, this.currentPage, this.pageSize).subscribe({
      next: async (response: OpenpanelApiResponse<any>) => {
        this.listaEntradas = response.data.elements || [];
        this.totalPages = response.data.totalPages;

        this.listaEntradas = await Promise.all(
          this.listaEntradas.map(async (entrada) => {
            return {
              ...entrada,
              categoriasConComas: entrada.categorias.map((e) => e.nombre).join(', ')
            };
          })
        );
      },
      error: (err) => {
        if (err?.status === 404) {
          this.listaEntradas = [];
        }
      }
    });
  }

  private obtenerDatosUsuario(idUsuario: number): Promise<Usuario> {
    return new Promise((resolve, reject) => {
      this.usuarioService.obtenerPorId(idUsuario).subscribe({
        next: (response: OpenpanelApiResponse<any>) => {
          const usuario: Usuario = response.data ? response.data : Usuario;
          resolve(usuario);
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }

  public checkFechaPublicacion(fechaPublicacion: Date): string {
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