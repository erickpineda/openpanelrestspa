import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ChangePasswordComponent } from './change-password.component';
import { UsuarioService } from '../../../../../core/services/data/usuario.service';
import { ToastService } from '../../../../../core/services/ui/toast.service';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { GridModule, FormModule, ButtonModule, SpinnerModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { PerfilResponse } from '../../../../../core/models/perfil-response.model';
import { HttpContext } from '@angular/common/http';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockUsuario: PerfilResponse = {
    idUsuario: 1,
    username: 'testuser',
    email: 'test@example.com',
    nombre: 'Test',
    apellido: 'User',
    // add other required fields
  } as PerfilResponse;

  beforeEach(async () => {
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['changePassword']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      declarations: [ChangePasswordComponent],
      imports: [
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        GridModule,
        FormModule,
        ButtonModule,
        SpinnerModule,
        IconModule,
      ],
      providers: [
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    component.usuario = mockUsuario;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty fields', () => {
    expect(component.form.get('currentPassword')?.value).toBe('');
    expect(component.form.get('newPassword')?.value).toBe('');
    expect(component.form.get('confirmPassword')?.value).toBe('');
  });

  it('should be invalid when fields are empty', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('should validate password match', () => {
    component.form.patchValue({
      currentPassword: 'old',
      newPassword: 'newPassword123',
      confirmPassword: 'differentPassword',
    });
    expect(component.form.hasError('mismatch')).toBeTrue();
    expect(component.form.valid).toBeFalsy();

    component.form.patchValue({
      confirmPassword: 'newPassword123',
    });
    expect(component.form.hasError('mismatch')).toBeFalse();
    expect(component.form.valid).toBeTrue();
  });

  it('should call usuarioService.changePassword on submit when valid', () => {
    component.form.patchValue({
      currentPassword: 'old',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    });

    usuarioServiceSpy.changePassword.and.returnValue(of({} as any));

    component.onSubmit();

    expect(usuarioServiceSpy.changePassword).toHaveBeenCalledWith(
      {
        idUsuario: 1,
        username: 'testuser',
        password: 'newPassword123',
      },
      jasmine.any(HttpContext)
    );
    expect(toastServiceSpy.showSuccess).toHaveBeenCalled();
  });

  it('should handle error on submit', () => {
    component.form.patchValue({
      currentPassword: 'old',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    });

    usuarioServiceSpy.changePassword.and.returnValue(throwError(() => new Error('Error')));

    component.onSubmit();

    expect(usuarioServiceSpy.changePassword).toHaveBeenCalled();
    expect(toastServiceSpy.showError).toHaveBeenCalled();
  });
});
