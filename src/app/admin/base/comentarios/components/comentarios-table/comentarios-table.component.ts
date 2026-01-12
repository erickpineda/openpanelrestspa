import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Comentario } from '../../../../../core/models/comentario.model';

@Component({
  selector: 'app-comentarios-table',
  templateUrl: './comentarios-table.component.html',
  styleUrls: ['./comentarios-table.component.scss'],
  standalone: false
})
export class ComentariosTableComponent {
  @Input() pagedComentarios: Comentario[] = [];
  @Input() cargando: boolean = false;
  
  @Input() totalElements: number = 0;
  @Input() numberOfElements: number = 0;
  @Input() pageNo: number = 0;
  @Input() pageSize: number = 10;
  @Input() totalPages: number = 1;

  @Output() pageChange = new EventEmitter<number>();
  @Output() edit = new EventEmitter<Comentario>();
  @Output() delete = new EventEmitter<Comentario>();

  trackByComentario(index: number, comentario: Comentario): number {
    return comentario.idComentario;
  }
  
  getTotalPages(): number {
      return this.totalPages;
  }

  onPageChange(page: number) {
      this.pageChange.emit(page);
  }
}
