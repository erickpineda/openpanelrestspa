import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { environment } from '@env/environment';
import { OPConstants } from '@shared/constants/op-global.constants';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';

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
  private apiUrl = `${environment.backend.host}${environment.backend.uri}/usuarios`;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private tokenStorage: TokenStorageService,
    private http: HttpClient
  ) {
    this.loadLocalPreferences();
    this.applyPreferences(this.prefs$.value);
  }

  getPreferences() {
    return this.prefs$.asObservable();
  }

  getCurrentPreferences(): ReaderPreferences {
    return this.prefs$.value;
  }

  setInitialPreferences(prefs: any | null) {
    if (prefs) {
      const normalized = this.normalizeIncomingPreferences(prefs);
      const updated = { ...this.defaultPrefs, ...normalized };
      this.prefs$.next(updated);
      this.saveLocalPreferences(updated);
      this.applyPreferences(updated);
    }
  }

  resetToDefaultOrSystem() {
    this.prefs$.next(this.defaultPrefs);
    this.saveLocalPreferences(this.defaultPrefs);
    this.applyPreferences(this.defaultPrefs);
  }

  updatePreferences(newPrefs: Partial<ReaderPreferences>) {
    const previous = this.prefs$.value;
    const updated = { ...previous, ...newPrefs };
    
    this.prefs$.next(updated);
    this.saveLocalPreferences(updated);
    this.applyPreferences(updated);

    const username = this.getUsername();
    if (username) {
      this.http.put(`${this.apiUrl}/${username}/preferencias`, this.mapToBackendPreferences(updated)).pipe(
        catchError(() => {
          // Si falla, podríamos revertir, pero al ser preferencias visuales
          // suele ser mejor dejar la UI optimista y que lo intente luego.
          return of(null);
        })
      ).subscribe();
    }
  }

  private loadLocalPreferences() {
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

  private saveLocalPreferences(prefs: ReaderPreferences) {
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

  private getUsername(): string | null {
    const user = this.tokenStorage.getUser();
    return user?.username ?? null;
  }

  private normalizeIncomingPreferences(prefs: any): ReaderPreferences {
    const theme = String(prefs?.theme ?? '').trim().toLowerCase();
    const fontSize = String(prefs?.fontSize ?? '').trim().toLowerCase();

    const normalizedTheme: ReaderPreferences['theme'] =
      theme === 'light' || theme === 'dark' || theme === 'auto' ? theme : this.defaultPrefs.theme;

    const normalizedFontSize: ReaderPreferences['fontSize'] =
      fontSize === 'small' || fontSize === 'large'
        ? fontSize
        : fontSize === 'medium'
          ? 'normal'
          : fontSize === 'normal'
            ? 'normal'
            : this.defaultPrefs.fontSize;

    return { theme: normalizedTheme, fontSize: normalizedFontSize };
  }

  private mapToBackendPreferences(prefs: ReaderPreferences): { theme: 'light' | 'dark'; fontSize: 'small' | 'medium' | 'large' } {
    const effectiveTheme: 'light' | 'dark' =
      prefs.theme === 'auto'
        ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : prefs.theme;

    const backendFontSize: 'small' | 'medium' | 'large' =
      prefs.fontSize === 'normal' ? 'medium' : prefs.fontSize;

    return { theme: effectiveTheme, fontSize: backendFontSize };
  }
}
