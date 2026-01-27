import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Entrada } from '@app/core/models/entrada.model';
import { EntradaVM } from '../../models/entrada.vm';
import { getEstadoInfo as getEstadoInfoHelper } from '../../utils/estado-utils';
import { parseAllowedDate } from '@shared/utils/date-utils';

@Component({
  selector: 'app-entradas-table',
  templateUrl: './entradas-table.component.html',
  styleUrls: ['./entradas-table.component.scss'],
  standalone: false,
})
export class EntradasTableComponent {
  @Input() entradas: EntradaVM[] = [];
  @Input() loading: boolean = false;
  @Input() pagingInfo: { page: number; total: number; pages: number; pageSize: number } | null =
    null;
  @Input() baseRoute: string = '/admin/control/entradas';

  @Output() pageChange = new EventEmitter<number>();
  @Output() preview = new EventEmitter<EntradaVM>();
  @Output() delete = new EventEmitter<EntradaVM>();

  getFechaDate(fecha: string | Date | undefined): Date | null {
    return parseAllowedDate(fecha ?? null);
  }

  getEstadoInfo(entrada: EntradaVM): { color: string; icon: string; tooltip: string } {
    return getEstadoInfoHelper(entrada);
  }

  trackByEntradaId(index: number, entrada: EntradaVM): number {
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
