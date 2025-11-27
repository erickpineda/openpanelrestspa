import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-global-error',
  template: `
      <div class="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div class="text-center">
          <h1 class="display-1 text-danger">😵</h1>
          <h2>Error {{ errorCode }}</h2>
          <p class="lead">{{ errorMessage }}</p>
          
          <div class="mt-4">
            <button cButton color="primary" routerLink="/">
              Volver al Inicio
            </button>
            <button cButton color="secondary" class="ms-2" (click)="reload()">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    `
})
export class GlobalErrorComponent {
  errorCode: string = '500';
  errorMessage: string = 'Error interno del sistema';

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.errorCode = params['code'] || '500';
      this.setErrorMessage();
    });
  }

  private setErrorMessage(): void {
    const messages: { [key: string]: string } = {
      '404': 'La página que buscas no existe.',
      '500': 'Error interno del servidor.',
      'critical': 'Error crítico en la aplicación.'
    };
    
    this.errorMessage = messages[this.errorCode] || 'Ha ocurrido un error inesperado.';
  }

  reload(): void {
    window.location.reload();
  }
} 