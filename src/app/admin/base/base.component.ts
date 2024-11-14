import { Component, OnInit } from '@angular/core';
import { delay } from 'rxjs';
import { LoadingService } from 'src/app/core/services/loading.service';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html'
})
export class BaseComponent implements OnInit {

  loading$ = this.loader.loading$;
  loading: boolean = false;
  cargaFinalizada: boolean = false;

  constructor(public loader: LoadingService) { }

  ngOnInit(): void {
    this.listenToLoading();
  }

  public perfectScrollbarConfig = {
    suppressScrollX: true,
  };

  private listenToLoading(): void {
    this.loader.loadingSub
      .pipe(delay(0)) // This prevents a ExpressionChangedAfterItHasBeenCheckedError for subsequent requests
      .subscribe((loading) => {
        this.loading = loading;
        this.cargaFinalizada = !loading;
        console.log(this.cargaFinalizada);
      });
  }
}