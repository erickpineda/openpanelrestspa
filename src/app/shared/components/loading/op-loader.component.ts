import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LoadingService } from '../../../core/services/ui/loading.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export type LoaderStyle = 'spinner' | 'dots' | 'pulse' | 'progress' | 'modern';
export type LoaderPosition = 'center' | 'top' | 'fullscreen';

@Component({
  selector: 'app-op-loader',
  templateUrl: './op-loader.component.html',
  styleUrls: ['./op-loader.component.scss'],
})
export class OpLoaderComponent implements OnInit, OnDestroy {
  @Input() message = 'Cargando...';
  @Input() overlay = true;
  @Input() fullScreen = true;
  @Input() position: LoaderPosition = 'center';
  @Input() debounceTime = 100;
  @Input() loaderStyle: LoaderStyle = 'progress';
  @Input() size: 'sm' = 'sm';
  @Input() color:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info' = 'primary';

  loading = false;
  private loadingSubscription!: Subscription;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    // Comportamiento original: suscribirse al loading global
    this.loadingSubscription = this.loadingService.globalLoading$
      .pipe(debounceTime(this.debounceTime), distinctUntilChanged())
      .subscribe((loading) => {
        this.loading = loading;
      });
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  getCombinedClasses(): string {
    const baseClasses = [];

    if (this.overlay) {
      baseClasses.push('loading-overlay');
    }

    if (this.fullScreen) {
      baseClasses.push('full-screen');
    }

    baseClasses.push(`loader-${this.loaderStyle}`);
    baseClasses.push(`loader-size-${this.size}`);
    baseClasses.push(`loader-color-${this.color}`);
    baseClasses.push(`loader-position-${this.position}`);

    return baseClasses.join(' ');
  }

  get loaderClasses(): string {
    return `loader-${this.loaderStyle} loader-size-${this.size} loader-color-${this.color} loader-position-${this.position}`;
  }
}
