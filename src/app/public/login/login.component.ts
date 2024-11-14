import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { cilUser, cilLockLocked } from '@coreui/icons';
import { CommonFunctionalityComponent } from 'src/app/shared/components/funcionalidades-comunes/common-functionality.component';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent extends CommonFunctionalityComponent implements OnInit {

  icons = { cilUser, cilLockLocked };

  form: any = {
    username: null,
    password: null
  };
  isLoggedIn = false;
  isLoginFailed = false;
  isLoading = false; // Nueva variable de estado de carga
  errorMessage = '';
  roles: string[] = [];

  constructor(
    protected override datePipe: DatePipe,
    protected override router: Router,
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private cdr: ChangeDetectorRef
  ) {
    super(router, datePipe);
  }
  
  override ngOnInit(): void {
    if (this.tokenStorage.getToken()) {
      this.isLoggedIn = true;
      this.roles = this.tokenStorage.getUser().roles;
    }
  }

  onSubmit(): void {
    this.isLoading = true; // Inicia el estado de carga
    const { username, password } = this.form;
    this.authService.login(username, password).subscribe({
      next: data => {
        this.tokenStorage.saveToken(data.jwttoken);
        this.tokenStorage.saveUser(data);
        this.isLoginFailed = false;
        this.isLoggedIn = true;
        this.roles = this.tokenStorage.getUser().roles;
        this.isLoading = false; // Finaliza el estado de carga
        setTimeout(() => {
          this.reloadComponent(false, '/admin'); // Añade un retraso antes de la navegación
        }, 500); // Retraso de 500ms
      },
      error: err => {
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
        this.isLoading = false; // Finaliza el estado de carga
        this.cdr.detectChanges(); // Forzar detección de cambios
      }
    });
  }

  override reloadPage(): void {
    window.location.reload();
  }
}