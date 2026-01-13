import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Entrada } from '../../../../../core/models/entrada.model';

@Component({
  selector: 'app-entradas-table',
  templateUrl: './entradas-table.component.html',
  styleUrls: [],
  standalone: false
})
export class EntradasTableComponent {
  @Input() entradas: Entrada[] = [];
  @Input() loading: boolean = false;
  @Input() pagingInfo: { page: number; total: number; pages: number; pageSize: number } | null = null;
  @Input() baseRoute: string = '/admin/control/entradas'; // Default route

  @Output() pageChange = new EventEmitter<number>();
  @Output() preview = new EventEmitter<Entrada>();
  @Output() delete = new EventEmitter<Entrada>();

  // Helper para convertir fechas
  getFechaDate(fecha: string | Date | undefined): Date | null {
    if (!fecha) return null;
    return new Date(fecha);
  }

  // Helper para info de estado (simplificado para ejemplo, idealmente vendría de un helper compartido o pipe)
  getEstadoInfo(entrada: Entrada): { color: string; icon: string; tooltip: string } {
    const nombreEstado = entrada.estadoEntrada?.nombre?.toUpperCase();
    
    switch (nombreEstado) {
      case 'PUBLICADA':
        return { color: 'success', icon: 'cilCheckCircle', tooltip: 'Publicada' };
      case 'NO PUBLICADA':
        return { color: 'danger', icon: 'cilXCircle', tooltip: 'No Publicada' };
      case 'GUARDADA':
      case 'BORRADOR':
        return { color: 'secondary', icon: 'cilSave', tooltip: 'Guardada' };
      case 'PENDIENTE REVISION':
        return { color: 'warning', icon: 'cilWarning', tooltip: 'Pendiente Revisión' };
      case 'EN REVISION':
        return { color: 'info', icon: 'cilZoom', tooltip: 'En Revisión' };
      case 'REVISADA':
        return { color: 'primary', icon: 'cilTask', tooltip: 'Revisada' };
      case 'HISTORICA':
        return { color: 'dark', icon: 'cilHistory', tooltip: 'Histórica' };
      case 'PROGRAMADA':
        return { color: 'info', icon: 'cilCalendar', tooltip: 'Programada' };
      default:
        return { color: 'secondary', icon: 'cilFile', tooltip: entrada.estadoEntrada?.nombre || 'Archivada' };
    }
  }
  
  // Helper para verificar fecha publicación
  checkFechaPublicacion(fecha: any): string {
      if (!fecha) return 'No programada';
      return new Date(fecha).toLocaleString();
  }

  trackByEntradaId(index: number, entrada: Entrada): number {
    return entrada.idEntrada;
  }

  onPrev() {
    if (this.pagingInfo && this.pagingInfo.page > 0) {
      this.pageChange.emit(this.pagingInfo.page - 1);
    }
  }

  onNext() {
    if (this.pagingInfo && this.pagingInfo.page < this.pagingInfo.pages - 1) {
      this.pageChange.emit(this.pagingInfo.page + 1);
    }
  }
}
