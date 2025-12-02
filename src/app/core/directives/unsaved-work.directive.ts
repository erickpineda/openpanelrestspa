import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';
import { UnsavedWorkService } from '../services/utils/unsaved-work.service';
import { LoggerService } from '../services/logger.service';
import { OPConstants } from '../../shared/constants/op-global.constants';

@Directive({
  selector: '[appUnsavedWork]'
})
export class UnsavedWorkDirective implements OnInit, OnDestroy {
  @Input() appUnsavedWork: string = '';

  private formId: any;
  private initialFormData: any;

  constructor(
    private el: ElementRef,
    private unsavedWorkService: UnsavedWorkService,
    private log: LoggerService
  ) {}

  ngOnInit(): void {
    const form = this.el.nativeElement;
    this.formId = this.appUnsavedWork || `form-${Date.now()}`;
    
    this.log.info(`📝 UnsavedWorkDirective: Registrando formulario: ${this.formId}`);
    
    // Guardar estado inicial
    this.initialFormData = this.getFormData(form);
    this.unsavedWorkService.registerForm(this.formId, this.initialFormData);
    
    // Guardar en localStorage para persistencia
    this.saveToLocalStorage();
    
    // Configurar observadores
    this.setupMutationObserver(form);
    this.setupEventListeners(form);
    
    // Marcar visualmente
    form.classList.add('unsaved-work-tracked');
    form.setAttribute('data-tracked-form', this.formId);
    
    this.log.info(`✅ UnsavedWorkDirective: Formulario ${this.formId} registrado`);
  }

  ngOnDestroy(): void {
    this.unsavedWorkService.unregisterForm(this.formId);
  }

  private saveToLocalStorage(): void {
    const forms = JSON.parse(localStorage.getItem(OPConstants.Storage.UNSAVED_FORMS_KEY) || '{}');
    forms[this.formId] = {
      initialData: this.initialFormData,
      hasChanges: false
    };
    localStorage.setItem(OPConstants.Storage.UNSAVED_FORMS_KEY, JSON.stringify(forms));
  }

  private setupMutationObserver(form: any): void {
    const observer = new MutationObserver(() => {
      this.checkFormChanges(form);
    });

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input: any) => {
      observer.observe(input, { 
        attributes: true, 
        attributeFilter: ['value', 'checked', 'class'] 
      });
    });
  }

  private setupEventListeners(form: any): void {
    const events = ['input', 'change', 'keyup'];
    
    events.forEach(eventType => {
      form.addEventListener(eventType, () => {
        setTimeout(() => {
          this.checkFormChanges(form);
        }, 0);
      });
    });

    form.addEventListener('submit', () => {
      this.markFormAsSaved(form);
    });
  }

  private checkFormChanges(form: any): void {
    const currentData = this.getFormData(form);
    const hasChanges = this.hasFormDataChanged(this.initialFormData, currentData);
    
    if (hasChanges) {
      this.markFormAsUnsaved(form, currentData);
    } else {
      this.markFormAsSaved(form);
    }
  }

  private getFormData(form: any): any {
    const formData: any = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input: any) => {
      if (input.name) {
        if (input.type === 'checkbox') {
          formData[input.name] = input.checked;
        } else if (input.type === 'radio') {
          if (input.checked) {
            formData[input.name] = input.value;
          }
        } else {
          formData[input.name] = input.value;
        }
      }
    });
    
    return formData;
  }

  private hasFormDataChanged(initial: any, current: any): boolean {
    return JSON.stringify(initial) !== JSON.stringify(current);
  }

  private markFormAsUnsaved(form: any, currentData: any): void {
    form.classList.add('unsaved-work-modified');
    form.classList.add('ng-dirty');
    form.classList.add('ng-touched');
    form.setAttribute('data-unsaved', 'true');
    
    // Actualizar en el servicio
    this.unsavedWorkService.updateFormValue(this.formId, currentData);
    
    // Actualizar en localStorage
    const forms = JSON.parse(localStorage.getItem(OPConstants.Storage.UNSAVED_FORMS_KEY) || '{}');
    if (forms[this.formId]) {
      forms[this.formId].hasChanges = true;
      forms[this.formId].currentData = currentData;
      localStorage.setItem(OPConstants.Storage.UNSAVED_FORMS_KEY, JSON.stringify(forms));
    }
  }

  private markFormAsSaved(form: any): void {
    form.classList.remove('unsaved-work-modified');
    form.removeAttribute('data-unsaved');
    
    this.unsavedWorkService.markFormAsSaved(this.formId);
    
    // Actualizar en localStorage
    const forms = JSON.parse(localStorage.getItem(OPConstants.Storage.UNSAVED_FORMS_KEY) || '{}');
    if (forms[this.formId]) {
      forms[this.formId].hasChanges = false;
      localStorage.setItem(OPConstants.Storage.UNSAVED_FORMS_KEY, JSON.stringify(forms));
    }
  }
}
