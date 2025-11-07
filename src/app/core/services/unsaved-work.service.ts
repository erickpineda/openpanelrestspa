import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnsavedWorkService {
  private unsavedWorkSubject = new Subject<boolean>();
  public unsavedWork$ = this.unsavedWorkSubject.asObservable();

  private unsavedForms = new Set<string>();

  constructor() {
    // Escuchar evento para guardar trabajo antes del logout
    window.addEventListener('saveUnsavedWork', this.saveAllUnsavedWork.bind(this));
  }

  public registerForm(formId: string): void {
    this.unsavedForms.add(formId);
    this.updateUnsavedWorkStatus();
  }

  public unregisterForm(formId: string): void {
    this.unsavedForms.delete(formId);
    this.updateUnsavedWorkStatus();
  }

  public markFormAsSaved(formId: string): void {
    this.unsavedForms.delete(formId);
    this.updateUnsavedWorkStatus();
  }

  public markFormAsUnsaved(formId: string): void {
    this.unsavedForms.add(formId);
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

  public hasUnsavedWork(): boolean {
    return this.unsavedForms.size > 0;
  }
}