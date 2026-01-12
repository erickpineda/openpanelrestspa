import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { LoggerService } from '../logger.service';
import { OPConstants } from '../../../shared/constants/op-global.constants';

@Injectable({
  providedIn: 'root',
})
export class UnsavedWorkService {
  private unsavedWorkSubject = new Subject<boolean>();
  public unsavedWork$ = this.unsavedWorkSubject.asObservable();

  private unsavedForms = new Map<string, boolean>();
  private formValues = new Map<string, any>();

  constructor(private log: LoggerService) {
    // Compatibilidad: escucha evento legacy y evento nuevo
    window.addEventListener(
      OPConstants.Events.SAVE_UNSAVED_WORK,
      this.saveAllUnsavedWork.bind(this)
    );
    window.addEventListener(
      OPConstants.Events.SAVE_WORK_BEFORE_LOGOUT,
      this.saveAllUnsavedWork.bind(this)
    );
  }

  public registerForm(formId: string, initialValue?: any): void {
    this.log.info(`📝 UnsavedWorkService: Registrando formulario ${formId}`);
    this.unsavedForms.set(formId, false);
    if (initialValue) {
      this.formValues.set(formId, JSON.stringify(initialValue));
    }
    this.updateUnsavedWorkStatus();
  }

  public unregisterForm(formId: string): void {
    this.log.info(`📝 UnsavedWorkService: Eliminando formulario ${formId}`);
    this.unsavedForms.delete(formId);
    this.formValues.delete(formId);
    this.updateUnsavedWorkStatus();
  }

  public updateFormValue(formId: string, currentValue: any): void {
    const initialValue = this.formValues.get(formId);
    const currentValueStr = JSON.stringify(currentValue);

    const hasChanged = initialValue !== currentValueStr;
    this.log.info(`📝 UnsavedWorkService: Formulario ${formId} - Cambios: ${hasChanged}`);

    this.unsavedForms.set(formId, hasChanged);
    this.updateUnsavedWorkStatus();
  }

  public markFormAsSaved(formId: string): void {
    this.log.info(`📝 UnsavedWorkService: Formulario ${formId} marcado como guardado`);
    this.unsavedForms.set(formId, false);
    this.updateUnsavedWorkStatus();
  }

  private updateUnsavedWorkStatus(): void {
    const hasUnsaved = this.hasUnsavedWork();
    this.log.info(`📝 UnsavedWorkService: Estado actual - Trabajo sin guardar: ${hasUnsaved}`);
    this.unsavedWorkSubject.next(hasUnsaved);
    (window as any).__UNSAVED_WORK__ = hasUnsaved;
  }

  public hasUnsavedWork(): boolean {
    const hasUnsaved = Array.from(this.unsavedForms.values()).some((hasUnsaved) => hasUnsaved);
    this.log.info(
      `📝 UnsavedWorkService: Verificando trabajo sin guardar - Resultado: ${hasUnsaved}`
    );
    return hasUnsaved;
  }

  private saveAllUnsavedWork(): void {
    const formsToSave = Array.from(this.unsavedForms.keys()).filter((formId) =>
      this.unsavedForms.get(formId)
    );
    this.log.info('💾 UnsavedWorkService: Guardando formularios:', formsToSave);

    const saveEvent = new CustomEvent(OPConstants.Events.SAVE_FORM_DATA, {
      detail: { forms: formsToSave },
    });
    window.dispatchEvent(saveEvent);
  }

  public cleanupStorage(): void {
    localStorage.removeItem(OPConstants.Storage.UNSAVED_FORMS_KEY);
  }
}
