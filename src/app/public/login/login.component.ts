import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { cilUser, cilLockLocked } from '@coreui/icons';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { TokenStorageService } from '../../core/services/auth/token-storage.service';
import { CommonFunctionalityService } from '../../shared/services/common-functionality.service';
import { AuthSyncService } from '../../core/services/auth/auth-sync.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

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
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router, // ✅ Usar Router en lugar del servicio custom
    private authSync: AuthSyncService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Sincronizar estado al iniciar
    this.authSync.initializeAuthState();
    
    if (this.tokenStorage.getToken()) {
      this.router.navigate(['/admin']);
    }
  }

  onSubmit(): void {
    this.isLoading = true;
    const { username, password } = this.form;
    
    this.authService.login(username, password).subscribe({
      next: data => {
        this.tokenStorage.saveToken(data.jwttoken);
        this.tokenStorage.saveUser(data);
        this.isLoginFailed = false;
        this.isLoggedIn = true;
        this.roles = this.tokenStorage.getUser().roles;
        this.isLoading = false;
        
        // ✅ Notificar a otras pestañas del login
        this.authSync.notifyLogin();
        
        setTimeout(() => {
          this.router.navigate(['/admin']); // ✅ Navegación estándar
        }, 500);
      },
      error: (err) => {
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  reloadPage(): void {
    window.location.reload();
  }
}