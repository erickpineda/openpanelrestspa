import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';
import { UnsavedWorkService } from '../services/unsaved-work.service';

@Directive({
  selector: '[appUnsavedWork]'
})
export class UnsavedWorkDirective implements OnInit, OnDestroy {
  @Input() appUnsavedWork: string = '';
  @Input() initialValue: any;

  private formId: string | any;

  constructor(
    private el: ElementRef,
    private unsavedWorkService: UnsavedWorkService
  ) {}

  ngOnInit(): void {
    const form = this.el.nativeElement;
    this.formId = this.appUnsavedWork || `form-${Date.now()}`;
    
    console.log(`📝 Registrando formulario: ${this.formId}`);
    
    // Registrar formulario con valor inicial
    this.unsavedWorkService.registerForm(this.formId, this.initialValue);
    
    // Escuchar cambios en todos los inputs del formulario
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input: any) => {
      input.addEventListener('input', this.onInputChange.bind(this));
      input.addEventListener('change', this.onInputChange.bind(this));
    });
    
    // Escuchar el evento de envío del formulario
    form.addEventListener('submit', this.onFormSubmit.bind(this));
    
    // Marcar visualmente el formulario
    form.classList.add('unsaved-work-tracked');
  }

  ngOnDestroy(): void {
    this.unsavedWorkService.unregisterForm(this.formId);
  }

  private onInputChange(): void {
    const form = this.el.nativeElement;
    const formData = this.getFormData(form);
    
    console.log(`📝 Formulario ${this.formId} modificado:`, formData);
    this.unsavedWorkService.updateFormValue(this.formId, formData);
    
    // Marcar visualmente
    form.setAttribute('data-unsaved', 'true');
    form.classList.add('unsaved-work-modified');
  }

  private onFormSubmit(): void {
    console.log(`📝 Formulario ${this.formId} enviado - marcando como guardado`);
    this.unsavedWorkService.markFormAsSaved(this.formId);
    
    const form = this.el.nativeElement;
    form.removeAttribute('data-unsaved');
    form.classList.remove('unsaved-work-modified');
  }

  private getFormData(form: any): any {
    const formData: any = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input: any) => {
      if (input.name) {
        if (input.type === 'checkbox' || input.type === 'radio') {
          formData[input.name] = input.checked;
        } else {
          formData[input.name] = input.value;
        }
      }
    });
    
    return formData;
  }
}
