import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { UsuarioService } from '../../../../../core/services/data/usuario.service';
import { ToastService } from '../../../../../core/services/ui/toast.service';
import { PerfilResponse } from '../../../../../core/models/perfil-response.model';
import { ChangePasswordDTO } from '../../../../../core/models/usuario.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  standalone: false,
})
export class ChangePasswordComponent implements OnInit {
  @Input() usuario: PerfilResponse | null = null;
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private toastService: ToastService
  ) {
    this.form = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(6), // Adjust based on requirements
            // Add more validators if needed (e.g. pattern)
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {}

  passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    return newPassword && confirmPassword && newPassword.value !== confirmPassword.value
      ? { mismatch: true }
      : null;
  };

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.usuario) {
      this.toastService.showError('No se pudo identificar al usuario.', 'Error');
      return;
    }

    this.loading = true;

    const changePasswordDTO: ChangePasswordDTO = {
      idUsuario: this.usuario.idUsuario,
      username: this.usuario.username,
      password: this.form.value.newPassword,
    };

    this.usuarioService
      .changePassword(changePasswordDTO)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Contraseña actualizada correctamente', 'Éxito');
          this.form.reset();
        },
        error: (err) => {
          console.error(err);
          this.toastService.showError('Error al actualizar la contraseña', 'Error');
        },
      });
  }
}
