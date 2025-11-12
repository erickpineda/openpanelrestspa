// busqueda.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { OpenpanelApiResponse } from '../../../core/models/openpanel-api-response.model';
import { Entrada } from '../../models/entrada.model';

interface BuscarResponse {
  elements: Entrada[];
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class BusquedaService {
  private searchSubject = new Subject<string>();
  private currentSubscription?: Subscription;

  // Modificar método de limpieza
  limpiarBusqueda(): void {
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
    }
    // Eliminar searchSubject.complete() para mantener el Subject activo
    this.searchSubject = new Subject<string>();
  }

  iniciarBusqueda(
    searchFunction: (term: string) => Observable<BuscarResponse>,
    callback: (results: BuscarResponse) => void,
    delay: number = 300
  ): void {
    this.limpiarBusqueda();

    this.currentSubscription = this.searchSubject.pipe(
      debounceTime(delay),
      switchMap(term => 
        searchFunction(term).pipe(
        )
      )
    ).subscribe(response => {
      if (response?.elements) {
        callback(response);
      }
    });
  }

  triggerBusqueda(term: string): void {
    this.searchSubject.next(term);
  }
}