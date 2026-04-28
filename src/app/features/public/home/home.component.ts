import { Component, OnInit, signal } from '@angular/core';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { Entrada } from '@app/core/models/entrada.model';
import { finalize } from 'rxjs/operators';
import { parseAllowedDate } from '@shared/utils/date-utils';
import { AnalyticsService } from '@app/core/services/analytics/analytics.service';
import { SearchQuery } from '@app/shared/models/search.models';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false,
})
export class HomeComponent implements OnInit {
  ultimasEntradas: Entrada[] = [];
  loading = false;

  constructor(
    private entradaService: EntradaService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.cargarUltimasEntradas();
  }

  cargarUltimasEntradas() {
    this.loading = true;
    const searchRequest: SearchQuery = {
      node: { type: 'condition', field: 'publicada', op: 'equal', value: true },
    };

    this.entradaService.buscarSafe(searchRequest, 0, 6, 'fechaPublicacion', 'DESC')
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.ultimasEntradas = res.elements || [];
        },
        error: (err) => {
          console.error('Error cargando entradas en home', err);
        }
      });
  }

  getFechaDate(fecha: any): Date | null {
    return parseAllowedDate(fecha);
  }

  trackCta(name: string): void {
    this.analytics.track('cta_click', { name, context: 'public_home' });
  }
}
