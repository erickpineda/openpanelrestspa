import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { parseAllowedDate, formatForBackend, isAllowedDateString } from '../utils/date-utils';

@Injectable({
  providedIn: 'root',
})
export class CommonFunctionalityService {
  constructor(
    private router: Router,
    private datePipe: DatePipe
  ) {}

  transformaFecha(fecha: Date | any, formato: string, flag: boolean): string {
    const d = parseAllowedDate(fecha);
    if (!d) return '';
    return this.datePipe.transform(d, formato) || '';
  }

  reloadComponent(self: boolean, urlToNavigateTo?: string) {
    const url = self ? this.router.url : urlToNavigateTo;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([`/${url}`]).then(() => {
        console.log(`After navigation I am on: ${this.router.url}`);
      });
    });
  }

  acortarTexto(texto: string, maxLength: number = 40): string {
    if (texto.length > maxLength) {
      return texto.substring(0, maxLength) + '...';
    }
    return texto;
  }

  reloadPage() {
    window.location.reload();
  }

  // Wrappers para mantener compatibilidad si alguien sigue inyectando el servicio
  parseAllowedDate(input: string | Date | number | null | undefined): Date | null {
    return parseAllowedDate(input);
  }

  formatForBackend(input: string | Date, withTime: boolean = true): string | null {
    return formatForBackend(input, withTime);
  }

  isAllowedDateString(input: string | null | undefined): boolean {
    return isAllowedDateString(input);
  }
}
