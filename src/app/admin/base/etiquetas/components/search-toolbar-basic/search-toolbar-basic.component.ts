import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-search-toolbar-basic',
  templateUrl: './search-toolbar-basic.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SearchToolbarBasicComponent {
  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() sizeOptions: number[] = [5, 10, 20];
  @Input() searchText = '';
  @Input() disabled = false;
  @Input() totalPages = 1;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() searchTextChange = new EventEmitter<string>();
  @Output() toggleAdvanced = new EventEmitter<void>();

  onPrev(): void {
    if (this.page > 1) this.pageChange.emit(this.page - 1);
  }
  onNext(): void {
    if (this.page < this.totalPages) this.pageChange.emit(this.page + 1);
  }
}
