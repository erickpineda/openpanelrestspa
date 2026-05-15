import { Component } from '@angular/core';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  standalone: false,
})
export class BaseComponent {
  loading: boolean = false;
  cargaFinalizada: boolean = false;

  public perfectScrollbarConfig = {
    suppressScrollX: true,
  };
}
