import { Component, Input, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { LoadingService } from '../../../core/services/ui/loading.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export type LoaderStyle = 'spinner' | 'dots' | 'pulse' | 'progress' | 'modern';
export type LoaderPosition = 'center' | 'top' | 'fullscreen';

@Component({
  selector: 'app-op-loader',
  templateUrl: './op-loader.component.html',
  styleUrls: ['./op-loader.component.scss'],
  exportAs: 'opLoader',
  standalone: false,
})
export class OpLoaderComponent implements OnInit, OnDestroy, OnChanges {
  @Input() message = 'Cargando...';
  @Input() overlay = true;
  @Input() fullScreen = true;
  @Input() position: LoaderPosition = 'center';
  @Input() debounceTime = 100;
  @Input() loaderStyle: LoaderStyle = 'progress';
  @Input() size: 'sm' = 'sm';
  @Input() color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' = 'primary';

  @Input() useGlobal: boolean = true;
  private _active: boolean = false;
  @Input() set active(val: boolean) {
    this._active = !!val;
    if (!this.useGlobal) {
      this.loading = this._active;
    }
  }
  get active(): boolean {
    return this._active;
  }

  loading = false;
  errorActive = false;
  errorMessage: string = '';
  private loadingSubscription!: Subscription;
  private errorSubscription!: Subscription;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    if (this.useGlobal) {
      this.loadingSubscription = this.loadingService.globalLoading$
        .pipe(debounceTime(this.debounceTime), distinctUntilChanged())
        .subscribe((loading) => {
          this.loading = loading;
        });

      this.errorSubscription = this.loadingService.error$
        .pipe(debounceTime(this.debounceTime), distinctUntilChanged())
        .subscribe((err) => {
          this.errorActive = !!err?.active;
          this.errorMessage = err?.message || '';
        });
    } else {
      this.loading = !!this.active;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.useGlobal && changes['active']) {
      this.loading = !!changes['active'].currentValue;
    }
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
    if (this.errorSubscription) {
      this.errorSubscription.unsubscribe();
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

  onRetry(): void {
    this.loadingService.triggerRetry();
  }

  onCloseError(): void {
    this.loadingService.clearError();
  }

  show(): void {
    if (this.useGlobal) return;
    this.loading = true;
  }

  hide(): void {
    if (this.useGlobal) return;
    this.loading = false;
  }

  toggle(): void {
    if (this.useGlobal) return;
    this.loading = !this.loading;
  }
}
