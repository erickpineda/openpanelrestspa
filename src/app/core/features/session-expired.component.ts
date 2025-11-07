import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionExpirationData } from '../../core/services/session-manager.service';

@Component({
  selector: 'app-session-expired',
  templateUrl: './session-expired.component.html',
  styleUrls: ['./session-expired.component.scss']
})
export class SessionExpiredComponent implements OnInit {
  sessionData: SessionExpirationData | null = null;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    this.sessionData = navigation?.extras?.state?.['sessionData'] || null;
  }

  ngOnInit(): void {
    // Si no hay datos de sesión, redirigir al home
    if (!this.sessionData) {
      this.router.navigate(['/']);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}