// busqueda.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { OpenpanelApiResponse } from '../../../core/models/openpanel-api-response.model';
import { Entrada } from '../../models/entrada.model';

interface BuscarResponse {
  elements: Entrada[];
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class BusquedaService {
  private searchSubject = new Subject<string>();
  private currentSubscription?: Subscription;
  private searchFunction?: (
    term: string,
    page?: number,
  ) => Observable<BuscarResponse>;

  // Modificar método de limpieza
  limpiarBusqueda(): void {
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
    }
    // Eliminar searchSubject.complete() para mantener el Subject activo
    this.searchSubject = new Subject<string>();
  }

  iniciarBusqueda(
    searchFunction: (term: string, page?: number) => Observable<BuscarResponse>,
    callback: (results: BuscarResponse) => void,
    delay: number = 300,
  ): void {
    this.limpiarBusqueda();
    this.searchFunction = searchFunction;

    this.currentSubscription = this.searchSubject
      .pipe(
        debounceTime(delay),
        switchMap((term) =>
          // use stored function; when invoked by the subject we rely on the component
          // to manage currentPage internally (searchFunction may use component state)
          this.searchFunction
            ? this.searchFunction(term)
            : of({ elements: [], totalPages: 0 }),
        ),
      )
      .subscribe((response) => {
        if (response?.elements) {
          callback(response);
        }
      });
  }

  triggerBusqueda(term: string): void {
    this.searchSubject.next(term);
  }

  /**
   * Ejecuta la búsqueda inmediatamente (sin debounce), usando la función de búsqueda
   * registrada en `iniciarBusqueda` y permitiendo pasar el número de página explícito.
   */
  searchNow(term: string, page?: number): Observable<BuscarResponse> {
    if (!this.searchFunction) {
      return of({ elements: [], totalPages: 0 });
    }
    return this.searchFunction(term, page);
  }
}
