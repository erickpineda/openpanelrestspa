/**
 * Clase base para componentes de buscador avanzado.
 * Contiene la lógica común y las definiciones necesarias para construir un buscador avanzado reutilizable.
 *
 * Principales características:
 * - Soporta campos dinámicos y operaciones configurables.
 * - Permite priorizar campos en el orden de presentación.
 * - Soporta carga dinámica de catálogos para selects.
 * - Puede emitir eventos de búsqueda automáticamente (autoTrigger) o bajo demanda.
 * - Es fácilmente integrable con servicios externos y componentes padres.
 *
 * Uso recomendado:
 * 1. Definir las definiciones de campos y operaciones desde el padre.
 * 2. Configurar los campos prioritarios y de catálogo según la entidad.
 * 3. Proveer la función de carga de catálogos si es necesario.
 * 4. Escuchar los eventos de filtro para ejecutar la búsqueda.
 */
import { EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';

export abstract class BuscadorAvanzadoBase {
  /**
   * Lista de campos disponibles para búsqueda, adaptados para el selector.
   */
  public camposDisponibles: any[] = [];

  /**
   * Lista de operaciones disponibles para el campo seleccionado.
   */
  public operacionesDisponibles: any[] = [];

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
   * Evento que se emite cuando se selecciona o ejecuta un filtro de búsqueda.
   */
  public filtroSeleccionado = new EventEmitter<any>();

  /**
   * Evento que se emite en cada cambio de filtro (si autoTrigger está activo).
   */
  public filtroChanged = new EventEmitter<any>();

  /**
   * Opciones de catálogo cargadas dinámicamente (clave -> lista de nombres).
   */
  protected catalogOptions: { [key: string]: string[] } = {};

  /**
   * Suscripción a la carga de catálogos (para limpiar en OnDestroy).
   */
  protected catalogosSub?: Subscription;

  /**
   * Método abstracto para inicializar el buscador. Debe ser implementado por las clases hijas.
   */
  abstract inicializarBuscador(): void;

  /**
   * Método abstracto para actualizar las operaciones disponibles. Debe ser implementado por las clases hijas.
   */
  abstract actualizarOperacionesDisponibles(): void;

  /**
   * Emite el filtro seleccionado actual al padre.
   */
  protected emitirFiltro(): void {
    this.filtroSeleccionado.emit({
      campo: this.campoSeleccionado,
      operacion: this.operacionSeleccionada,
      valor: this.valorBusqueda,
    });
  }
}
