import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { LanguageService, Language } from './language.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translationsSubject = new BehaviorSubject<any>({});
  public translations$ = this.translationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private languageService: LanguageService,
    private logger: LoggerService
  ) {
    this.init();
  }

  private init(): void {
    this.languageService.currentLang$.pipe(
      switchMap(lang => this.loadTranslations(lang))
    ).subscribe(translations => {
      this.translationsSubject.next(translations);
    });
  }

  private loadTranslations(lang: Language): Observable<any> {
    return this.http.get(`assets/i18n/${lang}.json`).pipe(
      tap(() => this.logger.debug(`Traducciones cargadas para: ${lang}`)),
      catchError(err => {
        this.logger.error(`Error cargando traducciones para ${lang}`, err);
        return of({});
      })
    );
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value = this.translationsSubject.value;
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  }
  
  // Método auxiliar para obtener valor instantáneo si se requiere (usar con cuidado)
  get instant(): any {
    return this.translationsSubject.value;
  }
}
