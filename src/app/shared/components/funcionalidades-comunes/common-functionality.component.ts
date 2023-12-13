import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-common-functionality',
  template: `
    <p>
      common-functionality works!
    </p>
  `,
  styles: [
  ]
})
export class CommonFunctionalityComponent implements OnInit {

  constructor(protected router: Router, protected datePipe: DatePipe) { }

  ngOnInit(): void {
  }

  transformaFecha(fecha: Date, formato: string, flag: boolean): string {
    var resultado;
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
    //skipLocationChange:true means dont update the url to / when navigating
    console.log("Current route I am on:", this.router.url);
    const url = self ? this.router.url : urlToNavigateTo;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([`/${url}`]).then(() => {
        console.log(`After navigation I am on:${this.router.url}`)
      })
    })
  }

  reloadPage() {
    window.location.reload()
  }

}