import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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

  @Output() filtroSeleccionado = new EventEmitter<any>();
  @Output() filtroChanged = new EventEmitter<any>(); // emite en cada cambio (si autoTrigger)

  camposDisponibles: any[] = [];
  operacionesDisponibles: any[] = [];
  campoSeleccionado: string = '';
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';

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
    this.valorBusqueda = '';
    // Propagar al subject para que el debounce/autoTrigger lo maneje
    this.valorSubject.next(this.valorBusqueda);
    // Emitir filtro vacío inmediatamente para que el padre pueda actuar
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
    const campos = this.definiciones.filterKeySegunClazzNamePermitido as string[] || [];
    const camposOrdenados = [
      ...campos.filter(k => k === 'titulo'),
      ...campos.filter(k => k !== 'titulo').sort((a, b) => a.localeCompare(b))
    ];
    this.camposDisponibles = camposOrdenados.map((key: string) => ({
      nombre: this.traducirCampo(key),
      valor: key
    }));
    this.campoSeleccionado = this.camposDisponibles[0]?.valor || '';
    this.actualizarOperacionesDisponibles();
  }

  actualizarOperacionesDisponibles(): void {
    if (!this.definiciones || !this.definiciones.operationPermitido) {
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