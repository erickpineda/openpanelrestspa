import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  // Para componentes que usan el patrón antiguo
  public loadingSub: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  
  private loadingMap: Map<string, boolean> = new Map<string, boolean>();

  constructor() {}

  setLoading(loading: boolean, url: string): void {
    if (!url) {
      throw new Error('La URL debe ser proporcionada para el loading');
    }

    if (loading) {
      this.loadingMap.set(url, loading);
      this.loadingSubject.next(true);
      this.loadingSub.next(true);
    } else if (!loading && this.loadingMap.has(url)) {
      this.loadingMap.delete(url);
    }

    // Solo ocultar loading cuando no hay más peticiones pendientes
    if (this.loadingMap.size === 0) {
      this.loadingSubject.next(false);
      this.loadingSub.next(false);
    }
  }
}
