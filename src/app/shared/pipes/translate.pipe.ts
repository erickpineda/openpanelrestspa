import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'translate',
  pure: false, // Necesario para detectar cambios de idioma dinámicamente
  standalone: true
})
export class TranslatePipe implements PipeTransform {
  constructor(private translationService: TranslationService) {}

  transform(key: string, params?: any): string {
    return this.translationService.translate(key, params);
  }
}
