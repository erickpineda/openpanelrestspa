import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';
import { UnsavedWorkService } from '../services/unsaved-work.service';

@Directive({
  selector: '[appUnsavedWork]'
})
export class UnsavedWorkDirective implements OnInit, OnDestroy {
  @Input() appUnsavedWork: string = '';

  constructor(
    private el: ElementRef,
    private unsavedWorkService: UnsavedWorkService
  ) {}

  ngOnInit(): void {
    const form = this.el.nativeElement;
    const formId = this.appUnsavedWork || `form-${Date.now()}`;
    
    // Registrar formulario
    this.unsavedWorkService.registerForm(formId);
    
    // Escuchar cambios en el formulario
    form.addEventListener('input', this.markAsUnsaved.bind(this, formId));
    form.addEventListener('change', this.markAsUnsaved.bind(this, formId));
    
    // Escuchar envío del formulario
    form.addEventListener('submit', this.markAsSaved.bind(this, formId));
    
    // Escuchar evento para guardar
    form.addEventListener('saveFormData', this.saveFormData.bind(this, formId));
  }

  ngOnDestroy(): void {
    const formId = this.appUnsavedWork || `form-${Date.now()}`;
    this.unsavedWorkService.unregisterForm(formId);
  }

  private markAsUnsaved(formId: string): void {
    this.unsavedWorkService.markFormAsUnsaved(formId);
    this.el.nativeElement.setAttribute('data-unsaved', 'true');
  }

  private markAsSaved(formId: string): void {
    this.unsavedWorkService.markFormAsSaved(formId);
    this.el.nativeElement.removeAttribute('data-unsaved');
  }

  private saveFormData(formId: string): void {
    // Lógica para guardar el formulario
    const form = this.el.nativeElement;
    console.log(`Guardando formulario: ${formId}`, form);
    
    // Simular guardado
    setTimeout(() => {
      this.markAsSaved(formId);
    }, 1000);
  }
}