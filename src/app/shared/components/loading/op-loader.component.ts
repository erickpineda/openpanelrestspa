import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
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
  @Input() type: 'global' | 'any' = 'global'; // 'global' solo HTTP, 'any' incluye locales
  @Input() debounceTime = 100;
  
  loading = false;
  private loadingSubscription!: Subscription;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    const loading$ = this.type === 'global' 
      ? this.loadingService.globalLoading$
      : this.loadingService.state$.pipe(map(state => state.global || this.loadingService.isAnyLocalLoading()));

    this.loadingSubscription = loading$
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