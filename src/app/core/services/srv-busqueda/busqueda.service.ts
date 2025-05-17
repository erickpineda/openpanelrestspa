import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { OpenpanelApiResponse } from '../../../core/models/openpanel-api-response.model';

@Injectable({
  providedIn: 'root'
})
export class BusquedaService {
  private searchSubject = new Subject<string>();
  private currentSubscription?: Subscription;

  // Método para limpiar la búsqueda (AÑADIR ESTE MÉTODO)
  limpiarBusqueda(): void {
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
    }
    this.searchSubject.complete();
    this.searchSubject = new Subject<string>();
  }

  iniciarBusqueda(
    searchFunction: (term: string) => Observable<OpenpanelApiResponse<any>>,
    callback: (results: OpenpanelApiResponse<any>) => void,
    delay: number = 300
  ): void {
    this.limpiarBusqueda(); // Limpiar antes de nueva suscripción

    this.currentSubscription = this.searchSubject.pipe(
      debounceTime(delay),
      switchMap(term => searchFunction(term))
    ).subscribe({
      next: (response) => callback(response),
      error: (err) => {
        console.error('Error en búsqueda:', err);
        callback({
          result: {
            trackingId: '',
            timestamp: new Date().toISOString(),
            success: false,
            message: 'Error en la búsqueda'
          },
          error: err
        });
      }
    });
  }

  triggerBusqueda(term: string): void {
    this.searchSubject.next(term);
  }
}