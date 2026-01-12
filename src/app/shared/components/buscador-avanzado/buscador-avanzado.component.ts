/**
 * Componente genérico reutilizable para construir un buscador avanzado sobre cualquier entidad.
 * Permite definir dinámicamente los campos, operaciones y catálogos a utilizar, así como la lógica de búsqueda y autotrigger.
 * Principales características:
 * - Soporta campos dinámicos y operaciones configurables.
 * - Permite priorizar campos en el orden de presentación.
 * - Soporta carga dinámica de catálogos para selects.
 * - Puede emitir eventos de búsqueda automáticamente (autoTrigger) o bajo demanda.
 * - Es fácilmente integrable con servicios externos y componentes padres.
 * Uso recomendado:
 * 1. Definir las definiciones de campos y operaciones desde el padre.
 * 2. Configurar los campos prioritarios y de catálogo según la entidad.
 * 3. Proveer la función de carga de catálogos si es necesario.
 * 4. Escuchar los eventos de filtro para ejecutar la búsqueda.
 *
 * Ejemplo de uso del componente `buscador-avanzado` desde un componente padre:
 *
 * En el archivo TypeScript del componente padre (por ejemplo, `app.component.ts`):
 *
 * ```typescript
 * import { Component } from '@angular/core';
 *
 * @Component({
 *   selector: 'app-root',
 *   templateUrl: './app.component.html',
 *   styleUrls: ['./app.component.css']
 * })
 * export class AppComponent {
 *   campos = [
 *     { nombre: 'Nombre', tipo: 'texto' },
 *     { nombre: 'Edad', tipo: 'número' },
 *     { nombre: 'Fecha de registro', tipo: 'fecha' }
 *   ];
 *
 *   operaciones = [
 *     { nombre: 'Contiene', valor: 'contiene' },
 *     { nombre: 'Igual a', valor: 'igual' },
 *     { nombre: 'Mayor que', valor: 'mayor' }
 *   ];
 *
 *   filtrosAplicados: any[] = [];
 *
 *   onBuscar(filtros: any[]) {
 *     console.log('Filtros aplicados:', filtros);
 *     this.filtrosAplicados = filtros;
 *   }
 *
 *   onLimpiar() {
 *     console.log('Filtros limpiados');
 *     this.filtrosAplicados = [];
 *   }
 * }
 * ```
 *
 * En el archivo HTML del componente padre (por ejemplo, `app.component.html`):
 *
 * ```html
 * <div>
 *   <h1>Ejemplo de uso del Buscador Avanzado</h1>
 *
 *   <app-buscador-avanzado
 *     [campos]="campos"
 *     [operaciones]="operaciones"
 *     (buscar)="onBuscar($event)"
 *     (limpiar)="onLimpiar()"
 *   ></app-buscador-avanzado>
 *
 *   @if (filtrosAplicados.length > 0) {
 *     <div>
 *       <h2>Filtros Aplicados:</h2>
 *       <ul>
 *         @for (filtro of filtrosAplicados; track filtro.campo) {
 *           <li>
 *             {{ filtro.campo }} {{ filtro.operacion }} {{ filtro.valor }}
 *           </li>
 *         }
 *       </ul>
 *     </div>
 *  }
 * </div>
 * ```
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  getBuscadorDefinicionesAmigables,
  BuscadorDefinicionesAdaptadas,
  BuscadorCampoDef,
} from '../../utils/buscador-definiciones.util';
import { BusquedaService } from '../../../core/services/srv-busqueda/busqueda.service';

@Component({
  selector: 'app-buscador-avanzado',
  templateUrl: './buscador-avanzado.component.html',
  styleUrls: ['./buscador-avanzado.component.scss'],
  standalone: false,
})
export class BuscadorAvanzadoComponent implements OnChanges, OnInit, OnDestroy {
  // =================== Inputs ===================
  /**
   * Definiciones de campos y operaciones para el buscador.
   * Debe ser un objeto compatible con la utilidad getBuscadorDefinicionesAmigables.
   */
  @Input() definiciones: any;
  /**
   * Si es true, emite búsquedas automáticamente al escribir (autoTrigger).
   */
  @Input() autoTrigger: boolean = false;
  /**
   * Tiempo de debounce en ms para autoTrigger.
   */
  @Input() debounceMs: number = 300;
  /**
   * Mostrar/ocultar botón Buscar (legacy).
   */
  @Input() showButton: boolean = true;
  /**
   * Control fino del botón Buscar (nuevo).
   */
  @Input() showSearchButton?: boolean;
  /**
   * Mostrar botón Limpiar (nuevo).
   */
  @Input() showClearButton: boolean = false;
  /**
   * Placeholder para el input de búsqueda.
   */
  @Input() placeholder: string = 'Ingrese valor a buscar';
  /**
   * Campo por defecto que puede proveer el padre para mantener el componente genérico.
   */
  @Input() defaultField?: string;
  /**
   * Lista de claves de campos que deben aparecer primero en el orden de presentación.
   * Ejemplo: ['titulo']
   */
  @Input() camposPrioritarios: string[] = [];
  /**
   * Lista de claves de campos que requieren catálogo externo.
   * Ejemplo: ['tipoEntrada.nombre', 'estadoEntrada.nombre']
   */
  @Input() camposCatalogo: string[] = [];
  /**
   * Función para cargar catálogos externos, debe devolver un Observable<{ [key: string]: string[] }>.
   * El padre debe proveer la función adecuada según la entidad.
   */
  @Input() cargarCatalogosFn?: () => import('rxjs').Observable<{
    [key: string]: string[];
  }>;

  // =================== Outputs ===================
  /**
   * Evento que se emite cuando se selecciona o ejecuta un filtro de búsqueda.
   */
  @Output() filtroSeleccionado = new EventEmitter<any>();
  /**
   * Evento que se emite en cada cambio de filtro (si autoTrigger está activo).
   */
  @Output() filtroChanged = new EventEmitter<any>();

  // =================== Propiedades públicas ===================
  /**
   * Lista de campos disponibles para búsqueda, adaptados para el selector.
   */
  public camposDisponibles: any[] = [];
  /**
   * Lista de operaciones disponibles para el campo seleccionado.
   */
  public operacionesDisponibles: any[] = [];
  /**
   * Definiciones adaptadas del buscador (campos, operaciones, etc).
   */
  public adaptedDefs?: BuscadorDefinicionesAdaptadas;
  /**
   * Campo actualmente seleccionado para buscar.
   */
  public campoSeleccionado: string = '';
  /**
   * Operación actualmente seleccionada para el campo.
   */
  public operacionSeleccionada: string = '';
  /**
   * Valor actual del input de búsqueda.
   */
  public valorBusqueda: string = '';
  /**
   * Mensaje de error si falla la carga de catálogos.
   */
  public catalogosError: string | null = null;

  // =================== Propiedades privadas ===================
  /**
   * Opciones de catálogo cargadas dinámicamente (clave -> lista de nombres).
   */
  private catalogOptions: { [key: string]: string[] } = {};
  /**
   * Estado inicial del campo seleccionado (para restaurar en limpiar).
   */
  private initialCampoSeleccionado?: string;
  /**
   * Estado inicial de la operación seleccionada (para restaurar en limpiar).
   */
  private initialOperacionSeleccionada?: string;
  /**
   * Suscripción a la carga de catálogos (para limpiar en OnDestroy).
   */
  private catalogosSub?: Subscription;

  // =================== Constructor ===================
  /**
   * Constructor: inyecta el servicio de búsqueda.
   */
  constructor(private busquedaService: BusquedaService) {}

  // =================== Ciclo de vida ===================
  /**
   * Hook de inicialización. La lógica de debounce/autoTrigger la maneja BusquedaService.
   */
  ngOnInit(): void {
    // Ahora la lógica de debounce/autoTrigger la maneja `BusquedaService`.
  }

  /**
   * Hook de cambios en los inputs. Si cambian las definiciones, reinicializa el buscador.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['definiciones'] && this.definiciones) {
      this.inicializarBuscador();
    }
    // El debounce ya no se maneja localmente; `debounceMs` deberá ser pasado
    // al llamar `BusquedaService.iniciarBusqueda(...)` desde el componente padre.
  }

  /**
   * Hook de destrucción. Limpia la suscripción a catálogos si existe.
   */
  ngOnDestroy(): void {
    this.catalogosSub?.unsubscribe();
  }

  // =================== Getters ===================
  /**
   * Devuelve la definición del campo actualmente seleccionado.
   * Evita lógica en el template.
   */
  public get campoActual(): BuscadorCampoDef | undefined {
    return this.adaptedDefs?.campos?.find(
      (c: BuscadorCampoDef) => c.key === this.campoSeleccionado
    );
  }

  /**
   * Devuelve las opciones para el campo tipo select actualmente seleccionado.
   * Prioriza las opciones cargadas dinámicamente desde catálogos.
   */
  public get opcionesSelectActual(): string[] {
    const campo = this.campoActual;
    if (!campo) return [];
    if (this.catalogOptions && this.catalogOptions[campo.key]) {
      return this.catalogOptions[campo.key];
    }
    const defs = this.adaptedDefs;
    if (defs && defs.dataOptionPermitido) {
      if (Array.isArray(defs.dataOptionPermitido)) {
        return defs.dataOptionPermitido;
      } else if (
        typeof defs.dataOptionPermitido === 'object' &&
        defs.dataOptionPermitido !== null
      ) {
        return defs.dataOptionPermitido[campo.key] || [];
      }
    }
    return [];
  }

  // =================== Métodos públicos ===================
  /**
   * Determina si se debe mostrar el botón de búsqueda, considerando compatibilidad con showButton.
   */
  public debeMostrarBotonBusqueda(): boolean {
    return this.showSearchButton !== undefined ? this.showSearchButton : this.showButton;
  }

  /**
   * Ejecuta la búsqueda y emite el filtro seleccionado.
   */
  public buscar(): void {
    this.emitirFiltro();
  }

  /**
   * Restaura los valores iniciales del buscador y emite el filtro restaurado.
   * Si autoTrigger está activo, también emite filtroChanged y dispara búsqueda.
   */
  public limpiar(): void {
    this.campoSeleccionado =
      this.initialCampoSeleccionado || this.camposDisponibles[0]?.valor || '';
    this.actualizarOperacionesDisponibles();
    const ops = (this.operacionesDisponibles || []).map((o) => o.valor);
    const initialOp = this.initialOperacionSeleccionada || '';
    const prefersBeginsWith = ops.includes('BEGINS_WITH');
    this.operacionSeleccionada = prefersBeginsWith
      ? 'BEGINS_WITH'
      : ops.includes(initialOp)
        ? initialOp
        : ops[0] || '';
    this.valorBusqueda = '';
    if (this.autoTrigger) {
      this.filtroChanged.emit({
        campo: this.campoSeleccionado,
        operacion: this.operacionSeleccionada,
        valor: this.valorBusqueda,
      });
      this.busquedaService.triggerBusqueda(this.valorBusqueda);
    }
    this.filtroSeleccionado.emit({
      campo: this.campoSeleccionado,
      operacion: this.operacionSeleccionada,
      valor: this.valorBusqueda,
    });
  }

  /**
   * Maneja el cambio de valor en el input de búsqueda.
   * Si autoTrigger está activo, emite filtroChanged y dispara búsqueda.
   */
  public onValorChange(v: string): void {
    this.valorBusqueda = v;
    if (this.autoTrigger) {
      this.filtroChanged.emit({
        campo: this.campoSeleccionado,
        operacion: this.operacionSeleccionada,
        valor: this.valorBusqueda,
      });
      this.busquedaService.triggerBusqueda(this.valorBusqueda);
    }
  }

  /**
   * Carga catálogos usando la función genérica proporcionada por el padre.
   * Almacena los nombres en catalogOptions para que los selects tipo select los muestren.
   * Si ya están cargados, no vuelve a cargar.
   */
  public cargarCatalogosGenerico(): void {
    if (Object.keys(this.catalogOptions).length > 0) return;
    this.catalogosError = null;
    if (!this.cargarCatalogosFn) return;
    this.catalogosSub = this.cargarCatalogosFn().subscribe({
      next: (mapped) => {
        this.catalogOptions = { ...mapped };
      },
      error: (err) => {
        this.catalogosError = 'Error al cargar catálogos. Intente recargar la página.';
        console.error('Error cargando catálogos:', err);
      },
    });
  }

  // =================== Métodos privados ===================
  /**
   * Emite el filtro seleccionado actual al padre.
   */
  private emitirFiltro(): void {
    this.filtroSeleccionado.emit({
      campo: this.campoSeleccionado,
      operacion: this.operacionSeleccionada,
      valor: this.valorBusqueda,
    });
  }

  /**
   * Inicializa el buscador con las definiciones recibidas.
   * Ordena los campos, determina el campo inicial, carga catálogos si es necesario,
   * y precarga ejemplos si están definidos.
   */
  private inicializarBuscador(): void {
    if (!this.definiciones) return;
    this.adaptedDefs = getBuscadorDefinicionesAmigables(this.definiciones);
    const campos = this.adaptedDefs.campos || [];
    // Ordenar campos priorizando los definidos en camposPrioritarios
    const camposOrdenados = [
      ...campos.filter((c: any) => this.camposPrioritarios.includes(c.key)),
      ...campos
        .filter((c: any) => !this.camposPrioritarios.includes(c.key))
        .sort((a: any, b: any) => a.label.localeCompare(b.label)),
    ];
    this.camposDisponibles = camposOrdenados.map((c: any) => ({
      nombre: c.label,
      valor: c.key,
    }));
    // Determinar campo inicial: preferir el `defaultField` provisto por el padre si existe en las definiciones;
    // en caso contrario usar el primer campo disponible.
    const defaultProvided =
      this.defaultField && this.camposDisponibles.some((cd: any) => cd.valor === this.defaultField);
    let campoInicial = defaultProvided
      ? this.defaultField!
      : this.camposDisponibles[0]?.valor || '';

    // Precargar ejemplo si viene, pero sólo si el filterKey está permitido
    const ejemplo = this.adaptedDefs?.ejemplo;
    if (
      ejemplo &&
      Array.isArray(ejemplo.searchCriteriaList) &&
      ejemplo.searchCriteriaList.length > 0
    ) {
      const first = ejemplo.searchCriteriaList[0];
      const ejemploKey = first.filterKey;
      const permitido = this.camposDisponibles.some((cd: any) => cd.valor === ejemploKey);
      if (ejemploKey && permitido) {
        campoInicial = ejemploKey;
      }
    }

    this.campoSeleccionado = campoInicial;
    // Actualizar operaciones ahora que tenemos el campo seleccionado
    this.actualizarOperacionesDisponibles();

    // Si hay campos de catálogo definidos y función de carga, cargar catálogos
    const contieneCamposCatalogo = this.camposDisponibles.some((cd) =>
      this.camposCatalogo.includes(cd.valor)
    );
    if (contieneCamposCatalogo && this.cargarCatalogosFn) {
      this.cargarCatalogosGenerico();
    }

    // Si hay ejemplo, intentar precargar operación y valor (si operación es válida para el campo)
    if (
      ejemplo &&
      Array.isArray(ejemplo.searchCriteriaList) &&
      ejemplo.searchCriteriaList.length > 0
    ) {
      const first = ejemplo.searchCriteriaList[0];
      const opEjemplo = first.operation;
      const valorEjemplo = first.value;
      const opValida = this.operacionesDisponibles.some((o: any) => o.valor === opEjemplo);
      if (opEjemplo && opValida) {
        this.operacionSeleccionada = opEjemplo;
      }
      // No prefijar el input con el valor de ejemplo: usarlo como placeholder si el placeholder
      // actual es el por defecto. Dejar valorBusqueda vacío para que el usuario escriba.
      const DEFAULT_PLACEHOLDER = 'Ingrese valor a buscar';
      if (valorEjemplo !== undefined && this.placeholder === DEFAULT_PLACEHOLDER) {
        this.placeholder = valorEjemplo;
      }
    }

    // Guardar el estado inicial para que "Limpiar" pueda restaurarlo
    this.initialCampoSeleccionado = this.campoSeleccionado;
    this.initialOperacionSeleccionada = this.operacionSeleccionada;
  }

  /**
   * Actualiza la lista de operaciones disponibles para el campo seleccionado.
   * Si no hay definiciones, limpia las operaciones.
   */
  actualizarOperacionesDisponibles(): void {
    if (!this.adaptedDefs) {
      this.operacionesDisponibles = [];
      this.operacionSeleccionada = '';
      return;
    }
    const campoDef = this.adaptedDefs.campos.find((c) => c.key === this.campoSeleccionado);
    const operacionesCampo = (campoDef?.operaciones || [])
      .map((op: any) => ({ nombre: op.label, valor: op.value }))
      .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
    this.operacionesDisponibles = operacionesCampo;
    this.operacionSeleccionada =
      this.operacionesDisponibles[0]?.valor || this.operacionSeleccionada || '';
  }
}
