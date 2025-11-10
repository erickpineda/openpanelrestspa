import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LoadingService } from '../../../core/services/ui/loading.service';

@Component({
  selector: 'app-op-loader',
  templateUrl: './op-loader.component.html',
  styleUrls: ['./op-loader.component.scss']
})
export class OpLoaderComponent implements OnInit, OnDestroy {
  @Input() message = 'Cargando...';
  @Input() overlay = true;
  @Input() fullScreen = true;
  @Input() debounceTime = 100; // Evita flickering en cambios rápidos
  
  loading = false;
  private loadingSubscription!: Subscription;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.loadingSubscription = this.loadingService.loading$
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged()
      )
      .subscribe((loading) => {
        this.loading = loading;
      });
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }
}