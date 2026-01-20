import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  pure: false, // Necesario para detectar cambios de idioma dinámicamente
  standalone: true,
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private subscription: Subscription;
  private lastKey: string = '';
  private lastParams: any;
  private value: string = '';

  constructor(
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef
  ) {
    // Suscribirse a cambios en las traducciones
    this.subscription = this.translationService.translations$.subscribe(() => {
      // Forzar verificación de cambios cuando lleguen nuevas traducciones
      this.updateValue(this.lastKey, this.lastParams);
      this.cdr.markForCheck();
    });
  }

  transform(key: string, params?: any): string {
    if (key === this.lastKey && params === this.lastParams) {
      return this.value;
    }
    this.updateValue(key, params);
    return this.value;
  }

  private updateValue(key: string, params?: any): void {
    this.lastKey = key;
    this.lastParams = params;
    this.value = this.translationService.translate(key, params);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
