// busqueda.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { OpenpanelApiResponse } from '../../../core/models/openpanel-api-response.model';

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
    searchFunction: (term: string) => Observable<OpenpanelApiResponse<any>>,
    callback: (results: OpenpanelApiResponse<any>) => void,
    delay: number = 300
  ): void {
    this.limpiarBusqueda();

    this.currentSubscription = this.searchSubject.pipe(
      debounceTime(delay),
      switchMap(term => 
        searchFunction(term).pipe(
          // Manejar errores dentro del flujo
          catchError(err => {
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
            return []; // Retornar observable vacío para mantener activo el Subject
          })
        )
      )
    ).subscribe(response => {
      if (response?.result?.success) {
        callback(response);
      }
    });
  }

  triggerBusqueda(term: string): void {
    this.searchSubject.next(term);
  }
}