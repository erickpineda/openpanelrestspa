import { Component, OnInit } from '@angular/core';
import { LoadingService } from '../../core/services/ui/loading.service';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  standalone: false,
})
export class BaseComponent implements OnInit {
  loading$: any;
  loading: boolean = false;
  cargaFinalizada: boolean = false;

  constructor(public loader: LoadingService) {}

  ngOnInit(): void {}

  public perfectScrollbarConfig = {
    suppressScrollX: true,
  };
}
