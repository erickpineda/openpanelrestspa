import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';
import { UnsavedWorkService } from '../services/unsaved-work.service';

@Directive({
  selector: '[appUnsavedWork]'
})
export class UnsavedWorkDirective implements OnInit, OnDestroy {
  @Input() appUnsavedWork: string = '';

  private formId: any;

  constructor(
    private el: ElementRef,
    private unsavedWorkService: UnsavedWorkService
  ) {
    console.log('🔄 UnsavedWorkDirective: Creando directiva para:', this.appUnsavedWork);
  }

  ngOnInit(): void {
    const form = this.el.nativeElement;
    this.formId = this.appUnsavedWork || `form-${Date.now()}`;
    
    console.log(`📝 Registrando formulario: ${this.formId}`);
    
    // Registrar formulario
    this.unsavedWorkService.registerForm(this.formId);
    
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
    form.setAttribute('data-tracked-form', this.formId);
    
    console.log(`✅ Formulario ${this.formId} registrado correctamente`);
  }

  ngOnDestroy(): void {
    this.unsavedWorkService.unregisterForm(this.formId);
  }

  private onInputChange(): void {
    const form = this.el.nativeElement;
    console.log(`📝 Formulario ${this.formId} modificado`);
    
    // Marcar como modificado
    form.classList.add('unsaved-work-modified');
    form.setAttribute('data-unsaved', 'true');
    
    // También marcar el formulario de Angular como dirty/touched
    form.classList.add('ng-dirty');
    form.classList.add('ng-touched');
  }

  private onFormSubmit(): void {
    console.log(`📝 Formulario ${this.formId} enviado - marcando como guardado`);
    
    const form = this.el.nativeElement;
    form.classList.remove('unsaved-work-modified');
    form.removeAttribute('data-unsaved');
  }
}
