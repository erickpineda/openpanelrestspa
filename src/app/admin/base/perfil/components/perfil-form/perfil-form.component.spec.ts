import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { PerfilFormComponent } from './perfil-form.component';
import { SharedCoreUiModule } from '../../../../../shared/shared-coreui.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PerfilFormComponent', () => {
  let component: PerfilFormComponent;
  let fixture: ComponentFixture<PerfilFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PerfilFormComponent],
      imports: [ReactiveFormsModule, SharedCoreUiModule, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when empty', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('email field validity', () => {
    const email = component.form.controls['email'];
    expect(email.valid).toBeFalsy(); // required

    email.setValue('test');
    expect(email.errors?.['email']).toBeTruthy();

    email.setValue('test@example.com');
    expect(email.errors).toBeNull();
  });

  it('should emit save event when valid', () => {
    spyOn(component.save, 'emit');

    component.form.controls['nombre'].setValue('Juan');
    component.form.controls['apellido'].setValue('Perez');
    component.form.controls['email'].setValue('juan@test.com');
    component.form.controls['telefono'].setValue('123456');

    component.onSubmit();

    expect(component.save.emit).toHaveBeenCalledWith(component.form.value);
  });
});
