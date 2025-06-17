import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';

@Component({
  selector: 'app-buscador-avanzado',
  templateUrl: './buscador-avanzado.component.html'
})
export class BuscadorAvanzadoComponent implements OnChanges {
  @Input() definiciones: any;
  @Output() filtroSeleccionado = new EventEmitter<any>();

  camposDisponibles: any[] = [];
  operacionesDisponibles: any[] = [];
  campoSeleccionado: string = '';
  operacionSeleccionada: string = '';
  valorBusqueda: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['definiciones'] && this.definiciones) {
      this.inicializarBuscador();
    }
  }

  public buscar(): void {
    this.filtroSeleccionado.emit({
      campo: this.campoSeleccionado,
      operacion: this.operacionSeleccionada,
      valor: this.valorBusqueda
    });
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