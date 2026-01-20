import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Usuario } from '../../../../../core/models/usuario.model';
import { Rol } from '../../../../../core/models/rol.model';
import { OPConstants } from '../../../../../shared/constants/op-global.constants';
import { UsuarioService } from '../../../../../core/services/data/usuario.service';
import { ToastService } from '../../../../../core/services/ui/toast.service';
import { TranslationService } from '../../../../../core/services/translation.service';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  standalone: false,
})
export class UsuarioFormComponent implements OnInit, OnChanges {
  @Input() usuario: Usuario | null = null;
  @Input() roles: Rol[] = [];
  @Input() loading = false;
  @Output() onSave = new EventEmitter<Usuario>();
  @Output() onEditEnabled = new EventEmitter<void>();

  form: FormGroup;
  disabled = false;
  passwordVisible = false;
  readonly PROPIETARIO_ROLE_CODE = OPConstants.Roles.PROPIETARIO;
  checkUsernameLoading = false;

  // Regex Patterns
  // Java: "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&-+=!.çÇ()])(?=\\S+$).{8,20}$"
  // Note: Escaping hyphen inside character class to ensure it's treated as a literal, not a range.
  readonly PASSWORD_PATTERN =
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&\-+=!.çÇ()])(?=\S+$).{8,20}$/;
  // Java: "[A-Za-z0-9]{4,30}\\w" -> Interpreted as ^[A-Za-z0-9]{4,30}\w$
  readonly USERNAME_PATTERN = /^[A-Za-z0-9]{4,30}\w$/;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private toastService: ToastService,
    private translate: TranslationService
  ) {
    this.form = this.fb.group({
      idUsuario: [0],
      username: ['', [Validators.required, Validators.pattern(this.USERNAME_PATTERN)]],
      password: [''],
      nombre: ['', Validators.required],
      apellido: [''],
      email: ['', [Validators.required, Validators.email]],
      rolCodigo: ['', Validators.required],
      habilitado: [true],
      emailConfirmado: [false],
    });
  }

  ngOnInit(): void {
    this.initFormState();
  }

  get initials(): string {
    const nombre = this.form.get('nombre')?.value || '';
    const apellido = this.form.get('apellido')?.value || '';
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }

  get roleColor(): string {
    const roleCode = this.form.get('rolCodigo')?.value;
    switch (roleCode) {
      case OPConstants.Roles.PROPIETARIO:
        return 'danger';
      case OPConstants.Roles.ADMINISTRADOR:
        return 'warning';
      case OPConstants.Roles.EDITOR:
        return 'info';
      case OPConstants.Roles.LECTOR:
        return 'secondary';
      default:
        return 'primary';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario']) {
      this.initFormState();
    }
  }

  public resetForm() {
    this.initFormState();
  }

  private initFormState() {
    this.form.reset({
      idUsuario: 0,
      username: '',
      password: '',
      nombre: '',
      apellido: '',
      email: '',
      rolCodigo: '',
      habilitado: true,
      emailConfirmado: false,
    });

    this.passwordVisible = false;

    if (this.usuario) {
      this.form.patchValue(this.usuario);

      // If editing existing user, password is optional
      if (this.usuario.idUsuario) {
        this.disabled = true;
        this.form.disable();
        this.form.get('password')?.clearValidators();
        this.form.get('password')?.updateValueAndValidity();
      } else {
        // New user
        this.disabled = false;
        this.form.enable();
        this.form
          .get('password')
          ?.setValidators([Validators.required, Validators.pattern(this.PASSWORD_PATTERN)]);
        this.form.get('password')?.updateValueAndValidity();
      }
    } else {
      this.disabled = false;
      this.form.enable();
      this.form
        .get('password')
        ?.setValidators([Validators.required, Validators.pattern(this.PASSWORD_PATTERN)]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  handleDisabledInteraction(actionName: string): boolean {
    if (this.disabled) {
      console.warn(`[DEBUG] Attempted to perform ${actionName} while edit mode is disabled.`);
      this.toastService.showWarning(
        this.translate.instant('ADMIN.USERS.EDIT_DISABLED_WARNING'),
        this.translate.instant('COMMON.WARNING')
      );
      return true;
    }
    return false;
  }

  checkUsernameAvailability() {
    if (this.handleDisabledInteraction('checkUsernameAvailability')) return;
    const usernameControl = this.form.get('username');
    if (!usernameControl || !usernameControl.value) return;

    // Optional: Validate format before checking availability to save API calls
    if (usernameControl.invalid) {
      usernameControl.markAsTouched();
      return;
    }

    const username = usernameControl.value;
    this.checkUsernameLoading = true;

    this.usuarioService.checkUsernameAvailability(username).subscribe({
      next: (response) => {
        this.checkUsernameLoading = false;
        // Backend returns "true" string if exists (taken), "false" if not exists (available)
        // Wrapped in RespuestaDTO: { respuesta: "true" } inside data
        // So path is response.data.respuesta
        const respuesta = response.data as any; // Cast to any or define proper interface if strictly needed
        const isTaken = respuesta?.respuesta === 'true';

        if (isTaken) {
          this.toastService.showError(
            this.translate.instant('ADMIN.USERS.USERNAME_TAKEN'),
            this.translate.instant('COMMON.ERROR')
          );
          usernameControl.setErrors({ taken: true });
        } else {
          this.toastService.showSuccess(
            this.translate.instant('ADMIN.USERS.USERNAME_AVAILABLE'),
            this.translate.instant('COMMON.SUCCESS')
          );
          // Ensure no errors are stuck
          usernameControl.setErrors(null);
        }
      },
      error: (err) => {
        this.checkUsernameLoading = false;
        // If backend throws 404 when NOT found (as per some interpretations), then 404 = Available.
        // But user provided code suggests it returns explicit response or throws exception.
        // If "perfil.username.x.no.existe" exception maps to 404, then it means available.
        if (err.status === 404) {
          this.toastService.showSuccess(
            this.translate.instant('ADMIN.USERS.USERNAME_AVAILABLE'),
            this.translate.instant('COMMON.SUCCESS')
          );
          usernameControl.setErrors(null);
        } else {
          this.toastService.showError(
            this.translate.instant('ADMIN.USERS.CHECK_USERNAME_ERROR'),
            this.translate.instant('COMMON.ERROR')
          );
        }
      },
    });
  }

  enableEdit() {
    this.disabled = false;
    this.form.enable();
    this.onEditEnabled.emit();
    // Username is immutable for existing users usually? Old code: [disabled]="!!usuario.idUsuario"
    if (this.usuario && this.usuario.idUsuario) {
      this.form.get('username')?.disable();
      // Password remains optional on edit unless user wants to change it
      // If user enters a password, it must match the pattern. But Validators.pattern passes on empty string if not required.
      // So we set pattern validator but NOT required.
      this.form.get('password')?.setValidators([Validators.pattern(this.PASSWORD_PATTERN)]);
      this.form.get('password')?.updateValueAndValidity();
    }

    // Check owner role lock
    if (this.PROPIETARIO_ROLE_CODE && this.usuario?.rolCodigo === this.PROPIETARIO_ROLE_CODE) {
      this.form.get('rolCodigo')?.disable();
      this.form.get('habilitado')?.disable();
      this.form.get('emailConfirmado')?.disable();
    }
  }

  togglePasswordVisibility() {
    if (this.handleDisabledInteraction('togglePasswordVisibility')) return;
    this.passwordVisible = !this.passwordVisible;
  }

  generatePassword() {
    if (this.handleDisabledInteraction('generatePassword')) return;
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowers = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specials = '@#$%&-+=!.çÇ()';
    const all = uppers + lowers + numbers + specials;

    // Ensure at least one of each required type
    let pass = '';
    pass += uppers.charAt(Math.floor(Math.random() * uppers.length));
    pass += lowers.charAt(Math.floor(Math.random() * lowers.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += specials.charAt(Math.floor(Math.random() * specials.length));

    // Fill remaining to reach 12 chars
    for (let i = 0; i < 8; i++) {
      pass += all.charAt(Math.floor(Math.random() * all.length));
    }

    // Shuffle
    pass = pass
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');

    this.form.get('password')?.setValue(pass);
    // passwordVisible remains false (hidden) by default, user must click to see it
  }

  generateUsername() {
    if (this.handleDisabledInteraction('generateUsername')) return;
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    const vowels = 'aeiou';
    let result = '';

    // Generate readable username base (CVCVCV pattern - 6 chars)
    for (let i = 0; i < 3; i++) {
      result += consonants.charAt(Math.floor(Math.random() * consonants.length));
      result += vowels.charAt(Math.floor(Math.random() * vowels.length));
    }

    // Add 2 random digits to ensure uniqueness and variety
    const randomNum = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');
    result += randomNum;

    this.form.get('username')?.setValue(result);
  }

  onUsernameInput(event: any) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const lowerValue = value.toLowerCase();

    if (value !== lowerValue) {
      input.value = lowerValue;
      this.form.get('username')?.setValue(lowerValue);
    }
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const payload: Usuario = { ...rawValue } as Usuario;

    // Fix: Ensure idRol is set based on rolCodigo
    if (payload.rolCodigo && this.roles.length > 0) {
      const selectedRole = this.roles.find((r) => r.codigo === payload.rolCodigo);
      if (selectedRole) {
        payload.idRol = selectedRole.idRol;
      }
    }

    this.onSave.emit(payload);
  }
}
