import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-inline-loader',
    template: `
    <div *ngIf="loading" class="inline-loader">
      <c-spinner [variant]="variant" [size]="size"></c-spinner>
      <span class="ms-2">{{ message }}</span>
    </div>
  `,
    styles: [`
    .inline-loader {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem;
    }
  `],
    standalone: false
})
export class InlineLoaderComponent {
  @Input() loading = false;
  @Input() message = 'Cargando...';
  @Input() variant: 'border' | 'grow' = 'border';
  @Input() size: 'sm' = 'sm';
}