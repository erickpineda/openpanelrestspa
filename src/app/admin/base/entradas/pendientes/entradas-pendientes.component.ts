import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EntradaService } from '../../../../core/services/data/entrada.service';
import { Entrada } from '../../../../core/models/entrada.model';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-entradas-pendientes',
  templateUrl: './entradas-pendientes.component.html',
  styleUrls: ['./entradas-pendientes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class EntradasPendientesComponent implements OnInit {
  visible = false;
  entradas: Entrada[] = [];
  cargando = false;

  pageSize: number = 50;

  constructor(
    private entradaService: EntradaService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {}

  openModal(): void {
    this.visible = true;
    this.cargarEntradasPendientes();
  }

  handleVisibleChange(event: boolean) {
    this.visible = event;
  }

  cargarEntradasPendientes(): void {
    this.cargando = true;
    this.cdr.markForCheck();

    const searchRequest = {
      dataOption: 'AND',
      searchCriteriaList: [
        {
          filterKey: 'estadoEntrada.nombre',
          value: 'PENDIENTE REVISION',
          operation: 'EQUAL',
          clazzName: 'Entrada',
        },
      ],
    };

    this.entradaService
      .buscarSafe(searchRequest, 0, this.pageSize)
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.entradas = response.elements;
        },
        error: (err) => {
          console.error('Error loading pending entries', err);
        },
      });
  }

  irAEditar(id: number): void {
    this.visible = false;
    setTimeout(() => {
      this.router.navigate(['/admin/control/entradas/editar', id]);
    }, 350);
  }
}
