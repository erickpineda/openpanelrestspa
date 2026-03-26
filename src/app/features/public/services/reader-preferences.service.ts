import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { OPConstants } from '@shared/constants/op-global.constants';

export interface ReaderPreferences {
  fontSize: 'small' | 'normal' | 'large';
  theme: 'light' | 'dark' | 'auto';
}

@Injectable({
  providedIn: 'root'
})
export class ReaderPreferencesService {
  private readonly defaultPrefs: ReaderPreferences = {
    fontSize: 'normal',
    theme: 'auto'
  };

  private prefs$ = new BehaviorSubject<ReaderPreferences>(this.defaultPrefs);

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.loadPreferences();
    this.applyPreferences(this.prefs$.value);
  }

  getPreferences() {
    return this.prefs$.asObservable();
  }

  getCurrentPreferences(): ReaderPreferences {
    return this.prefs$.value;
  }

  updatePreferences(newPrefs: Partial<ReaderPreferences>) {
    const updated = { ...this.prefs$.value, ...newPrefs };
    this.prefs$.next(updated);
    this.savePreferences(updated);
    this.applyPreferences(updated);
  }

  private loadPreferences() {
    const saved = localStorage.getItem(OPConstants.Storage.PUBLIC_READER_PREFS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.prefs$.next({ ...this.defaultPrefs, ...parsed });
      } catch (e) {
        // Ignorar error de parseo
      }
    }
  }

  private savePreferences(prefs: ReaderPreferences) {
    localStorage.setItem(OPConstants.Storage.PUBLIC_READER_PREFS, JSON.stringify(prefs));
  }

  private applyPreferences(prefs: ReaderPreferences) {
    const body = this.document.body;
    
    // Aplicar tamaño de fuente (solo al article/post-content si se desea, o global)
    body.classList.remove('reader-font-small', 'reader-font-normal', 'reader-font-large');
    body.classList.add(`reader-font-${prefs.fontSize}`);

    // Nota: El tema oscuro de CoreUI/Bootstrap 5.3 se maneja con data-coreui-theme
    if (prefs.theme === 'auto') {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.document.documentElement.setAttribute('data-coreui-theme', isDark ? 'dark' : 'light');
    } else {
      this.document.documentElement.setAttribute('data-coreui-theme', prefs.theme);
    }
  }
}