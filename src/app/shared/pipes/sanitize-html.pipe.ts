import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'sanitizeHtml',
  standalone: true,
})
export class SanitizeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: unknown): string {
    const raw = typeof value === 'string' ? value : '';
    return this.sanitizer.sanitize(SecurityContext.HTML, raw) ?? '';
  }
}
