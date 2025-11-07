import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnsavedWorkService {
  private unsavedWorkSubject = new Subject<boolean>();
  private unsavedForms = new Map<string, boolean>();
  private formValues = new Map<string, any>();

  constructor() {
    window.addEventListener('saveUnsavedWork', this.saveAllUnsavedWork.bind(this));
  }

  public registerForm(formId: string, initialValue?: any): void {
    this.unsavedForms.set(formId, false);
    if (initialValue) {
      this.formValues.set(formId, JSON.stringify(initialValue));
    }
    this.updateUnsavedWorkStatus();
  }

  public updateFormValue(formId: string, currentValue: any): void {
    const initialValue = this.formValues.get(formId);
    const currentValueStr = JSON.stringify(currentValue);
    
    const hasChanged = initialValue !== currentValueStr;
    this.unsavedForms.set(formId, hasChanged);
    this.updateUnsavedWorkStatus();
  }

  public markFormAsSaved(formId: string): void {
    this.unsavedForms.set(formId, false);
    this.updateUnsavedWorkStatus();
  }

  public hasUnsavedWork(): boolean {
    return Array.from(this.unsavedForms.values()).some(hasUnsaved => hasUnsaved);
  }

  public unregisterForm(formId: string): void {
    this.unsavedForms.delete(formId);
    this.updateUnsavedWorkStatus();
  }

  private updateUnsavedWorkStatus(): void {
    this.unsavedWorkSubject.next(this.unsavedForms.size > 0);
    
    // Actualizar estado global
    (window as any).__UNSAVED_WORK__ = this.unsavedForms.size > 0;
  }

  private saveAllUnsavedWork(): void {
    // Emitir evento para que cada formulario se guarde
    const saveEvent = new CustomEvent('saveFormData', {
      detail: { forms: Array.from(this.unsavedForms) }
    });
    window.dispatchEvent(saveEvent);
    
    // Aquí puedes implementar lógica específica para guardar cada formulario
    console.log('Guardando formularios:', Array.from(this.unsavedForms));
  }

}