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
    // Lógica básica basada en lo que vi en el componente original
    // Adaptar según los modelos reales de EstadoEntrada
    const nombreEstado = entrada.estadoEntrada?.nombre?.toUpperCase();
    
    if (nombreEstado === 'PUBLICADA') {
      return { color: 'text-success', icon: 'cilCheckCircle', tooltip: 'Publicada' };
    } else if (nombreEstado === 'BORRADOR') {
      return { color: 'text-warning', icon: 'cilPencil', tooltip: 'Borrador' };
    } else {
      return { color: 'text-secondary', icon: 'cilFile', tooltip: 'Archivada' }; // Fallback
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
