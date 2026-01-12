import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SafeUrl } from '@angular/platform-browser';
import { TemporaryStorageService } from '../../../../core/services/ui/temporary-storage.service';
import { LoggerService } from '../../../../core/services/logger.service';

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
  currentTemporaryEntryId: null
};

@Injectable()
export class EntradaFormStateService {
  private _state = new BehaviorSubject<FormState>(INITIAL_STATE);
  public state$ = this._state.asObservable();

  constructor(
    private temporaryStorage: TemporaryStorageService,
    private log: LoggerService
  ) {}

  // Getters for individual state properties (Observables)
  get loading$() { return new Observable<boolean>(observer => this.state$.subscribe(s => observer.next(s.loading))); }
  get imagenPreviewUrl$() { return new Observable<SafeUrl | string | null>(observer => this.state$.subscribe(s => observer.next(s.imagenPreviewUrl))); }
  get showRecoveryNotification$() { return new Observable<boolean>(observer => this.state$.subscribe(s => observer.next(s.showRecoveryNotification))); }

  // State Getters (Sync)
  get currentState(): FormState {
    return this._state.getValue();
  }

  // State Updaters
  updateState(newState: Partial<FormState>) {
    this._state.next({ ...this.currentState, ...newState });
  }

  setLoading(loading: boolean) {
    this.updateState({ loading });
  }

  setSubmitting(submitting: boolean) {
    this.updateState({ submitting });
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

  // Temporary Data Logic
  checkForTemporaryData(isEditing: boolean) {
    if (isEditing || this.currentState.isRecoveringFromNavigation) return;

    const temporaryEntries = this.temporaryStorage.getTemporaryEntriesByType('entrada');
    
    if (temporaryEntries.length > 0) {
      this.log.info('📥 Entradas temporales encontradas en formulario:', temporaryEntries);
      
      let dataToRecover = temporaryEntries[0];
      
      if (temporaryEntries.length > 1) {
        dataToRecover = temporaryEntries.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
      }

      this.updateState({ 
        temporaryData: dataToRecover,
        showRecoveryNotification: true 
      });
    }
  }

  dismissRecoveryNotification() {
    this.updateState({ showRecoveryNotification: false });
  }

  clearTemporaryData() {
    if (this.currentState.temporaryData) {
      this.temporaryStorage.removeTemporaryEntry(this.currentState.temporaryData.id);
      this.updateState({ temporaryData: null, showRecoveryNotification: false });
    }
  }

  setRecoveringFromNavigation(isRecovering: boolean) {
    this.updateState({ isRecoveringFromNavigation: isRecovering });
  }

  saveTemporaryEntry(data: { formData: any, title: string, description: string }) {
    try {
      const temporaryEntry = {
        formData: data.formData,
        timestamp: new Date().toISOString(),
        formType: 'entrada',
        title: data.title,
        description: data.description,
      };

      if (this.currentState.currentTemporaryEntryId) {
        this.temporaryStorage.removeTemporaryEntry(this.currentState.currentTemporaryEntryId);
      }

      const newId = this.temporaryStorage.saveTemporaryEntry(temporaryEntry);
      this.updateState({ currentTemporaryEntryId: newId });
      
      this.log.info('✅ Datos guardados en almacenamiento temporal con ID:', newId);
    } catch (error) {
      this.log.error('❌ Error al guardar temporalmente:', error);
    }
  }

  removeCurrentTemporaryEntry() {
    if (this.currentState.currentTemporaryEntryId) {
      this.temporaryStorage.removeTemporaryEntry(this.currentState.currentTemporaryEntryId);
      this.updateState({ currentTemporaryEntryId: null });
    }
  }
}
