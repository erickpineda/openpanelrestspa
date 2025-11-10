import { Component, Output, EventEmitter, OnInit, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { Subject } from "rxjs";

@Component({ template: '' })
export abstract class BaseFormComponent<T> implements OnInit, OnDestroy {
  @Output() submitForm = new EventEmitter<T>();
  @Output() cancel = new EventEmitter<T>();
  
  form!: FormGroup;
  loading = false;
  protected destroy$ = new Subject<void>();

  abstract buildForm(): FormGroup;
  abstract getFormDefaultValue(): T;

  ngOnInit(): void {
    this.form = this.buildForm();
    this.onInit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onInit(): void { }

  onSubmit(): void {
    if (this.form.valid && !this.loading) {
      this.loading = true;
      this.submitForm.emit(this.form.value);
    } else {
      this.markFormGroupTouched(this.form);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  resetForm(): void {
    this.form.reset(this.getFormDefaultValue());
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
