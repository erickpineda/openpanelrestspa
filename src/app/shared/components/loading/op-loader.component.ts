import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-op-loader',
  template: `
    <div *ngIf="loading" class="loading-overlay">
      <div class="loading-spinner">
        <c-spinner variant="grow"></c-spinner>
        <p class="mt-2">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    .loading-spinner {
      text-align: center;
    }
  `]
})
export class OpLoaderComponent {
  @Input() loading = false;
  @Input() message = 'Cargando...';
}