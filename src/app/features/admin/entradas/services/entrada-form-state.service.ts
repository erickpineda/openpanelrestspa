import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SafeUrl } from '@angular/platform-browser';
import { TemporaryStorageService } from '@app/core/services/ui/temporary-storage.service';
import { LoggerService } from '@app/core/services/logger.service';

export interface FormState {
  loading: boolean;
  submitting: boolean;
  error: any | null;
  imagenPreviewUrl: SafeUrl | string | null;
  isFullScreen: boolean;
  isFullWidth: boolean;
  showBackToTop: boolean;
  showRecoveryNotification: boolean;
  temporaryData: any | null;
  isRecoveringFromNavigation: boolean;
  currentTemporaryEntryId: string | null;
}

const INITIAL_STATE: FormState = {
  loading: false,
  submitting: false,
  error: null,
  imagenPreviewUrl: null,
  isFullScreen: false,
  isFullWidth: false,
  showBackToTop: false,
  showRecoveryNotification: false,
  temporaryData: null,
  isRecoveringFromNavigation: false,
  currentTemporaryEntryId: null,
};

@Injectable()
export class EntradaFormStateService {
  private _state = new BehaviorSubject<FormState>(INITIAL_STATE);
  public state$ = this._state.asObservable();

  constructor(
    private temporaryStorage: TemporaryStorageService,
    private log: LoggerService
  ) {}

  get currentState(): FormState {
    return this._state.getValue();
  }

  updateState(newState: Partial<FormState>) {
    this._state.next({ ...this.currentState, ...newState });
  }

  setRecoveringFromNavigation(value: boolean): void {
    this.updateState({ isRecoveringFromNavigation: value });
  }

  setImagenPreviewUrl(url: SafeUrl | string | null) {
    this.updateState({ imagenPreviewUrl: url });
  }

  toggleFullScreen() {
    this.updateState({ isFullScreen: !this.currentState.isFullScreen });
  }

  toggleFullWidth() {
    this.updateState({ isFullWidth: !this.currentState.isFullWidth });
  }

  saveTemporaryEntry(data: { formData: any; title?: string; description?: string }): void {
    const entry = {
      formData: data.formData,
      timestamp: new Date().toISOString(),
      formType: 'entrada',
      title: data.title,
      description: data.description,
    };

    // Pasamos el ID actual si existe para actualizar la entrada en lugar de crear una nueva
    const currentId = this.currentState.currentTemporaryEntryId || undefined;
    const id = this.temporaryStorage.saveTemporaryEntry(entry, currentId);

    if (id !== currentId) {
      this.updateState({ currentTemporaryEntryId: id });
    }
  }

  removeCurrentTemporaryEntry(): void {
    const id = this.currentState.currentTemporaryEntryId;
    if (!id) return;
    this.temporaryStorage.removeTemporaryEntry(id);
    this.updateState({ currentTemporaryEntryId: null });
  }

  checkForTemporaryData(estaEditando: boolean): void {
    if (estaEditando) {
      return;
    }

    const entries = this.temporaryStorage.getTemporaryEntriesByType('entrada');
    if (!entries || entries.length === 0) {
      return;
    }

    const latest = entries.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    this.updateState({
      showRecoveryNotification: true,
      temporaryData: latest,
      // No asignamos el ID inmediatamente para evitar sobrescribir la entrada existente
      // si el usuario decide ignorar la recuperación y empezar de cero.
      // currentTemporaryEntryId: latest.id, 
    });
  }

  dismissRecoveryNotification(): void {
    this.updateState({
      showRecoveryNotification: false,
      temporaryData: null,
      // Aseguramos que no haya un ID vinculado si se descarta la recuperación
      currentTemporaryEntryId: null,
    });
  }

  clearTemporaryData(): void {
    const id = this.currentState.currentTemporaryEntryId;
    if (id) {
      this.temporaryStorage.removeTemporaryEntry(id);
    }
    this.updateState({
      showRecoveryNotification: false,
      temporaryData: null,
      currentTemporaryEntryId: null,
    });
  }
}
