import { Component, OnInit } from '@angular/core';
import { AuthService } from '@app/core/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-public',
  templateUrl: './register-public.component.html',
  styleUrls: ['./register-public.component.scss'],
  standalone: false,
})
export class RegisterPublicComponent implements OnInit {
  form: any = { username: '', password: '', email: '', nombre: '', apellidos: '' };
  isLoading = false;
  isSuccessful = false;
  isSignUpFailed = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  onSubmit(): void {
    this.isLoading = true;
    this.authService.register(this.form).subscribe({
      next: (data) => {
        this.isSuccessful = true;
        this.isSignUpFailed = false;
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error en el registro';
        this.isSignUpFailed = true;
        this.isLoading = false;
      },
    });
  }
}
