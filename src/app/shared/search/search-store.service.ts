import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SearchQuery } from '../models/search.models';

interface SearchState {
  term: string;
  advanced?: SearchQuery | null;
  results: any[];
}

const INITIAL: SearchState = { term: '', advanced: null, results: [] };

@Injectable({ providedIn: 'root' })
export class SearchStoreService {
  private state = new BehaviorSubject<SearchState>(INITIAL);
  state$ = this.state.asObservable();

  setTerm(term: string): void {
    const s = this.state.value;
    this.state.next({ ...s, term });
  }

  setAdvanced(params: SearchQuery | null): void {
    const s = this.state.value;
    this.state.next({ ...s, advanced: params });
  }

  setResults(results: any[]): void {
    const s = this.state.value;
    this.state.next({ ...s, results });
  }

  clear(): void {
    this.state.next(INITIAL);
  }

  getSnapshot(): SearchState {
    return this.state.value;
  }
}
