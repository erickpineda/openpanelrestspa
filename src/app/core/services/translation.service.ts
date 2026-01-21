import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { LanguageService, Language } from './language.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private translationsSubject = new BehaviorSubject<any>({});
  public translations$ = this.translationsSubject.asObservable();

  private defaultTranslations: any = {};
  private readonly DEFAULT_LANG: Language = 'es';

  constructor(
    private http: HttpClient,
    private languageService: LanguageService,
    private logger: LoggerService
  ) {
    this.init();
  }

  private init(): void {
    // Cargar traducciones por defecto primero o en paralelo
    this.loadLanguage(this.DEFAULT_LANG).subscribe((trans) => {
      this.defaultTranslations = trans;

      // Suscribirse a cambios de idioma
      this.languageService.currentLang$
        .pipe(
          switchMap((lang) => {
            if (lang === this.DEFAULT_LANG && Object.keys(this.defaultTranslations).length > 0) {
              return of(this.defaultTranslations);
            }
            return this.loadLanguage(lang);
          })
        )
        .subscribe((translations) => {
          this.translationsSubject.next(translations);
        });
    });
  }

  private loadLanguage(lang: Language): Observable<any> {
    return this.http.get(`assets/i18n/${lang}.json`).pipe(
      tap(() => this.logger.debug(`Traducciones cargadas para: ${lang}`)),
      catchError((err) => {
        this.logger.error(`Error cargando traducciones para ${lang}`, err);
        return of({});
      })
    );
  }

  translate(key: string, params?: any): string {
    const translation =
      this.getValue(this.translationsSubject.value, key) ||
      this.getValue(this.defaultTranslations, key) ||
      key;

    if (params && typeof translation === 'string') {
      return this.interpolate(translation, params);
    }

    return typeof translation === 'string' ? translation : key;
  }

  private getValue(source: any, key: string): string | null {
    if (!source) return null;
    const keys = key.split('.');
    let value = source;

    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return null;
      }
    }
    return value;
  }

  private interpolate(text: string, params: any): string {
    return text.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (match, key) => {
      const value = params[key];
      return value !== undefined ? value : match;
    });
  }

  /**
   * Obtiene la traducción instantánea de una clave.
   * Si no se proporciona clave, devuelve todo el objeto de traducciones.
   */
  instant(key?: string, params?: any): any {
    if (!key) return this.translationsSubject.value;
    return this.translate(key, params);
  }
}
