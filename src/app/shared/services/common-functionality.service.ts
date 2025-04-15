import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CommonFunctionalityService {
  constructor(private router: Router, private datePipe: DatePipe) {}

  transformaFecha(fecha: Date, formato: string, flag: boolean): string {
    let resultado;
    if (fecha && !flag) {
      const str = fecha.toString();
      const [dateComponents, timeComponents] = str.split(' ');
      const [day, month, year] = dateComponents.split('-');
      const [hours, minutes, seconds] = timeComponents.split(':');
      const fechaObtenida = new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
      resultado = this.datePipe.transform(fechaObtenida, formato);
    } else if (fecha && flag) {
      resultado = this.datePipe.transform(fecha, formato);
    }
    return resultado ? resultado : '';
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
}