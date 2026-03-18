import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { PagingInfo } from '../../models/paging-info.model';

@Component({
  selector: 'app-entradas-filter',
  templateUrl: './entradas-filter.component.html',
  styleUrls: [],
  standalone: false,
})
export class EntradasFilterComponent {
  @Input() basicSearchText: string = '';
  @Input() showAdvanced: boolean = false;
  @Input() definiciones: any[] = [];
  @Input() cargarCatalogosFn!: () => Observable<any>;
  @Input() pagingInfo: PagingInfo | null = null;

  @Output() basicSearchChange = new EventEmitter<string>();
  @Output() toggleAdvanced = new EventEmitter<void>();
  @Output() filtroSeleccionado = new EventEmitter<any>();
  @Output() filtroChanged = new EventEmitter<any>();
  @Output() pageSizeChange = new EventEmitter<number>();

  onBasicSearchTextChange(value: string) {
    this.basicSearchChange.emit(value);
  }

  onPageSizeChange(value: number) {
    this.pageSizeChange.emit(Number(value));
  }
}
