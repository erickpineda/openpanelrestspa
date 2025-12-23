import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-op-pagination',
  templateUrl: './op-pagination.component.html',
  styleUrls: ['./op-pagination.component.scss'],
  standalone: false,
})
export class OpPaginationComponent implements OnChanges {
  @Input() totalPages: number = 0;
  @Input() currentPage: number = 0;
  @Input() paginasRange: number = 4;

  // Definir el tipo correcto para la alineación
  @Input() align: '' | 'start' | 'center' | 'end' = 'end';

  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();

  paginasVisibles: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalPages'] || changes['currentPage'] || changes['align']) {
      this.actualizarPaginasVisibles();
    }
  }

  actualizarPaginasVisibles(): void {
    const middle = Math.floor(this.paginasRange / 2);
    const start = Math.max(
      0,
      Math.min(this.currentPage - middle, this.totalPages - this.paginasRange),
    );
    const end = Math.min(this.totalPages, start + this.paginasRange);
    this.paginasVisibles = Array.from(
      { length: end - start },
      (_, i) => start + i,
    );
  }

  cambiarPagina(incremento: number): void {
    const nuevaPagina = this.currentPage + incremento;
    if (nuevaPagina >= 0 && nuevaPagina < this.totalPages) {
      this.pageChange.emit(nuevaPagina);
    }
  }
}
