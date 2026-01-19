import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-comentarios-filter',
  templateUrl: './comentarios-filter.component.html',
  styleUrls: [],
  standalone: false,
})
export class ComentariosFilterComponent {
  @Input() basicSearchText: string = '';
  @Input() showAdvanced: boolean = false;

  @Input() filtroUsuario: string = '';
  @Input() filtroAprobado: boolean | null = null;
  @Input() filtroCuarentena: boolean | null = null;

  @Input() totalElements: number = 0;
  @Input() pageSize: number = 10;
  @Input() cargando: boolean = false;

  @Output() basicSearchChange = new EventEmitter<string>();
  @Output() toggleAdvanced = new EventEmitter<void>();

  @Output() filtroUsuarioChange = new EventEmitter<string>();
  @Output() filtroAprobadoChange = new EventEmitter<boolean | null>();
  @Output() filtroCuarentenaChange = new EventEmitter<boolean | null>();

  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() reset = new EventEmitter<void>();
  @Output() search = new EventEmitter<void>();

  onBasicSearchTextChange(value: string) {
    this.basicSearchChange.emit(value);
  }

  onPageSizeChange(value: number) {
    this.pageSizeChange.emit(Number(value));
  }
}
