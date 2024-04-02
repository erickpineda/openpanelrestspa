import { Component, OnInit } from "@angular/core";
import { delay } from "rxjs";
import { LoadingService } from "src/app/core/services/loading.service";

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html'
})
export class BaseComponent implements OnInit {

  loading$ = this.loader.loading$;
  loading: boolean = false;
  cargaFinalizada: boolean = false;

  ngOnInit(): void {
    this.listenToLoading();
  }

  constructor(
    public loader: LoadingService
  ) {
  }

  public perfectScrollbarConfig = {
    suppressScrollX: true,
  };

  listenToLoading(): void {
    this.loader.loadingSub
      .pipe(delay(0)) // This prevents a ExpressionChangedAfterItHasBeenCheckedError for subsequent requests
      .subscribe((loading) => {
        this.loading = loading;
        if (loading === false) {
          this.cargaFinalizada = true;
          console.log(this.cargaFinalizada)
        }
      });
  }

}