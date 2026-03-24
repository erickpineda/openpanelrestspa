import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PublicEntradasStateService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private entradasSubject = new BehaviorSubject<any[]>([]);
  entradas$ = this.entradasSubject.asObservable();

  private totalPagesSubject = new BehaviorSubject<number>(1);
  totalPages$ = this.totalPagesSubject.asObservable();

  setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  setEntradas(entradas: any[]) {
    this.entradasSubject.next(entradas);
  }

  setTotalPages(totalPages: number) {
    const value = Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;
    this.totalPagesSubject.next(value);
  }
}
