import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'es' | 'en';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly LANG_KEY = 'app_lang';
  private currentLangSubject: BehaviorSubject<Language>;
  public currentLang$: Observable<Language>;

  constructor() {
    let defaultLang: Language = 'es';

    // 1. Intentar leer de localStorage
    const savedLang = localStorage.getItem(this.LANG_KEY) as Language;

    if (savedLang === 'en' || savedLang === 'es') {
      defaultLang = savedLang;
    }

    this.currentLangSubject = new BehaviorSubject<Language>(defaultLang);
    this.currentLang$ = this.currentLangSubject.asObservable();

    // Asegurar que esté en localStorage
    localStorage.setItem(this.LANG_KEY, defaultLang);
  }

  getCurrentLanguage(): Language {
    return this.currentLangSubject.value;
  }

  setLanguage(lang: Language): void {
    if (lang !== this.currentLangSubject.value) {
      localStorage.setItem(this.LANG_KEY, lang);
      this.currentLangSubject.next(lang);
    }
  }

  toggleLanguage(): void {
    const newLang = this.currentLangSubject.value === 'es' ? 'en' : 'es';
    this.setLanguage(newLang);
  }
}
