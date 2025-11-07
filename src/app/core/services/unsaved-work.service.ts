import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnsavedWorkService {
  private unsavedWorkSubject = new Subject<boolean>();
  public unsavedWork$ = this.unsavedWorkSubject.asObservable();

  private unsavedForms = new Map<string, boolean>();
  private formValues = new Map<string, any>();

  constructor() {
    window.addEventListener('saveUnsavedWork', this.saveAllUnsavedWork.bind(this));
  }

  public registerForm(formId: string, initialValue?: any): void {
    console.log(`📝 UnsavedWorkService: Registrando formulario ${formId}`);
    this.unsavedForms.set(formId, false);
    if (initialValue) {
      this.formValues.set(formId, JSON.stringify(initialValue));
    }
    this.updateUnsavedWorkStatus();
  }

  public unregisterForm(formId: string): void {
    console.log(`📝 UnsavedWorkService: Eliminando formulario ${formId}`);
    this.unsavedForms.delete(formId);
    this.formValues.delete(formId);
    this.updateUnsavedWorkStatus();
  }

  public updateFormValue(formId: string, currentValue: any): void {
    const initialValue = this.formValues.get(formId);
    const currentValueStr = JSON.stringify(currentValue);
    
    const hasChanged = initialValue !== currentValueStr;
    console.log(`📝 UnsavedWorkService: Formulario ${formId} - Cambios: ${hasChanged}`);
    
    this.unsavedForms.set(formId, hasChanged);
    this.updateUnsavedWorkStatus();
  }

  public markFormAsSaved(formId: string): void {
    console.log(`📝 UnsavedWorkService: Formulario ${formId} marcado como guardado`);
    this.unsavedForms.set(formId, false);
    this.updateUnsavedWorkStatus();
  }

  private updateUnsavedWorkStatus(): void {
    const hasUnsaved = this.hasUnsavedWork();
    console.log(`📝 UnsavedWorkService: Estado actual - Trabajo sin guardar: ${hasUnsaved}`);
    this.unsavedWorkSubject.next(hasUnsaved);
    (window as any).__UNSAVED_WORK__ = hasUnsaved;
  }

  public hasUnsavedWork(): boolean {
    const hasUnsaved = Array.from(this.unsavedForms.values()).some(hasUnsaved => hasUnsaved);
    console.log(`📝 UnsavedWorkService: Verificando trabajo sin guardar - Resultado: ${hasUnsaved}`);
    return hasUnsaved;
  }

  private saveAllUnsavedWork(): void {
    const formsToSave = Array.from(this.unsavedForms.keys()).filter(formId => this.unsavedForms.get(formId));
    console.log('💾 UnsavedWorkService: Guardando formularios:', formsToSave);
    
    const saveEvent = new CustomEvent('saveFormData', {
      detail: { forms: formsToSave }
    });
    window.dispatchEvent(saveEvent);
  }

  public cleanupStorage(): void {
    localStorage.removeItem('unsaved-forms');
  }
}