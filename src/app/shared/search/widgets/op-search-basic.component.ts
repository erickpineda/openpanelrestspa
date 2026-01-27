import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchStoreService } from '../search-store.service';

@Component({
  selector: 'op-search-basic',
  templateUrl: './op-search-basic.component.html',
  styleUrls: ['./op-search-basic.component.scss'],
  standalone: false,
})
export class OpSearchBasicComponent {
  @Input() placeholder: string = '';
  @Input() autoTrigger: boolean = false;
  @Output() onSearch = new EventEmitter<string>();
  @Output() onClear = new EventEmitter<void>();
  term: string = '';

  constructor(private store: SearchStoreService) {}

  setTerm(v: string): void {
    this.term = v;
    this.store.setTerm(v);
    if (this.autoTrigger) this.onSearch.emit(v);
  }

  search(): void {
    this.onSearch.emit(this.term);
  }

  clear(): void {
    this.term = '';
    this.store.clear();
    this.onClear.emit();
  }
}
