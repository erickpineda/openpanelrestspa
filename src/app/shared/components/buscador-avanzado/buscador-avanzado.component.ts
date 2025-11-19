import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { getBuscadorDefinicionesAmigables, BuscadorDefinicionesAdaptadas } from '../../utils/buscador-definiciones.util';

@Component({
  selector: 'app-buscador-avanzado',
  templateUrl: './buscador-avanzado.component.html'
})
export class BuscadorAvanzadoComponent implements OnChanges, OnInit, OnDestroy {
  @Input() definiciones: any;
  // Configuraciones para hacerlo genérico
  @Input() autoTrigger: boolean = false; // si true, emite búsquedas automáticamente al escribir
  @Input() debounceMs: number = 300; // tiempo de debounce para autoTrigger
  @Input() showButton: boolean = true; // mostrar/ocultar botón Buscar (legacy)
  @Input() showSearchButton?: boolean; // nuevo: control fino del botón Buscar
  @Input() showClearButton: boolean = false; // nuevo: mostrar botón Limpiar
  @Input() placeholder: string = 'Ingrese valor a buscar';
  @Input() defaultField?: string; // campo por defecto que puede proveer el padre para mantener el componente genérico

  @Output() filtroSeleccionado = new EventEmitter<any>();
  @Output() filtroChanged = new EventEmitter<any>(); // emite en cada cambio (si autoTrigger)

  camposDisponibles: any[] = [];
  operacionesDisponibles: any[] = [];
  adaptedDefs?: BuscadorDefinicionesAdaptadas;
  campoSeleccionado: string = '';
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';

  // Valores iniciales que representan el estado por defecto después de inicializar definiciones
  private initialCampoSeleccionado?: string;
  private initialOperacionSeleccionada?: string;

  private valorSubject = new Subject<string>();
  private valorSub?: Subscription;

  ngOnInit(): void {
    // Suscribir cambios con debounce para autoTrigger
    this.valorSub = this.valorSubject.pipe(debounceTime(this.debounceMs)).subscribe((v) => {
      if (this.autoTrigger) {
        this.emitirFiltro();
        this.filtroChanged.emit({ campo: this.campoSeleccionado, operacion: this.operacionSeleccionada, valor: this.valorBusqueda });
      }
    });
  }

  // Compatibilidad: si no se provee showSearchButton, usamos el antiguo showButton
  public debeMostrarBotonBusqueda(): boolean {
    return this.showSearchButton !== undefined ? this.showSearchButton : this.showButton;
  }

  ngOnDestroy(): void {
    this.valorSub?.unsubscribe();
    this.valorSubject.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['definiciones'] && this.definiciones) {
      this.inicializarBuscador();
    }
    if (changes['debounceMs'] && !changes['debounceMs'].firstChange) {
      // Reiniciar suscripción con nuevo debounce
      this.valorSub?.unsubscribe();
      this.valorSub = this.valorSubject.pipe(debounceTime(this.debounceMs)).subscribe((v) => {
        if (this.autoTrigger) {
          this.emitirFiltro();
          this.filtroChanged.emit({ campo: this.campoSeleccionado, operacion: this.operacionSeleccionada, valor: this.valorBusqueda });
        }
      });
    }
  }

  public buscar(): void {
    this.emitirFiltro();
  }

  public limpiar(): void {
    // Restaurar valores por defecto (los calculados en inicializarBuscador)
    this.campoSeleccionado = this.initialCampoSeleccionado || this.camposDisponibles[0]?.valor || '';
    // Actualizar operaciones disponibles para el campo restaurado
    this.actualizarOperacionesDisponibles();
    this.operacionSeleccionada = this.initialOperacionSeleccionada || this.operacionesDisponibles[0]?.valor || '';
    // Limpiar el valor de búsqueda y notificar
    this.valorBusqueda = '';
    // Propagar al subject para que el debounce/autoTrigger lo maneje
    this.valorSubject.next(this.valorBusqueda);
    // Emitir filtro con los valores restaurados para que el padre pueda actuar
    this.filtroSeleccionado.emit({
      campo: this.campoSeleccionado,
      operacion: this.operacionSeleccionada,
      valor: this.valorBusqueda
    });
  }

  private emitirFiltro(): void {
    this.filtroSeleccionado.emit({
      campo: this.campoSeleccionado,
      operacion: this.operacionSeleccionada,
      valor: this.valorBusqueda
    });
  }

  public onValorChange(v: string): void {
    this.valorBusqueda = v;
    // push to subject for debounce handling
    this.valorSubject.next(v);
  }

  private inicializarBuscador(): void {
    if (!this.definiciones) return;
    // Usar la utilidad para obtener definiciones amigables (acepta wrapper {result,data} o el data directamente)
    this.adaptedDefs = getBuscadorDefinicionesAmigables(this.definiciones);
    const campos = this.adaptedDefs.campos || [];
    // Dar preferencia a 'titulo' en el orden de presentación
    const camposOrdenados = [
      ...campos.filter((c: any) => c.key === 'titulo'),
      ...campos.filter((c: any) => c.key !== 'titulo').sort((a: any, b: any) => a.label.localeCompare(b.label))
    ];
    this.camposDisponibles = camposOrdenados.map((c: any) => ({ nombre: c.label, valor: c.key }));
    // Determinar campo inicial: preferir el `defaultField` provisto por el padre si existe en las definiciones;
    // en caso contrario usar el primer campo disponible.
    const defaultProvided = this.defaultField && this.camposDisponibles.some((cd: any) => cd.valor === this.defaultField);
    let campoInicial = defaultProvided ? this.defaultField! : this.camposDisponibles[0]?.valor || '';

    // Precargar ejemplo si viene, pero sólo si el filterKey está permitido
    const ejemplo = this.adaptedDefs?.ejemplo;
    if (ejemplo && Array.isArray(ejemplo.searchCriteriaList) && ejemplo.searchCriteriaList.length > 0) {
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

    // Si hay ejemplo, intentar precargar operación y valor (si operación es válida para el campo)
    if (ejemplo && Array.isArray(ejemplo.searchCriteriaList) && ejemplo.searchCriteriaList.length > 0) {
      const first = ejemplo.searchCriteriaList[0];
      const opEjemplo = first.operation;
      const valorEjemplo = first.value;
      const opValida = this.operacionesDisponibles.some((o: any) => o.valor === opEjemplo);
      if (opEjemplo && opValida) {
        this.operacionSeleccionada = opEjemplo;
      }
      // No prefijar el input con el valor de ejemplo: usarlo como placeholder si el placeholder
      // actual es el por defecto. Dejar `valorBusqueda` vacío para que el usuario escriba.
      const DEFAULT_PLACEHOLDER = 'Ingrese valor a buscar';
      if (valorEjemplo !== undefined && this.placeholder === DEFAULT_PLACEHOLDER) {
        this.placeholder = valorEjemplo;
      }
    }

    // Guardar el estado inicial para que "Limpiar" pueda restaurarlo
    this.initialCampoSeleccionado = this.campoSeleccionado;
    this.initialOperacionSeleccionada = this.operacionSeleccionada;
  }

  actualizarOperacionesDisponibles(): void {
    if (!this.adaptedDefs) {
      this.operacionesDisponibles = [];
      this.operacionSeleccionada = '';
      return;
    }
    const campoDef = this.adaptedDefs.campos.find(c => c.key === this.campoSeleccionado);
    const operacionesCampo = (campoDef?.operaciones || [])
      .map((op: any) => ({ nombre: op.label, valor: op.value }))
      .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
    this.operacionesDisponibles = operacionesCampo;
    this.operacionSeleccionada = this.operacionesDisponibles[0]?.valor || this.operacionSeleccionada || '';
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
}