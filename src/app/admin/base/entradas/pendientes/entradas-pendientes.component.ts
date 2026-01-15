import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EntradaService } from '../../../../core/services/data/entrada.service';
import { Entrada } from '../../../../core/models/entrada.model';
import { finalize, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-entradas-pendientes',
  templateUrl: './entradas-pendientes.component.html',
  styleUrls: ['./entradas-pendientes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class EntradasPendientesComponent implements OnInit, OnDestroy {
  visible = false;
  entradas: Entrada[] = [];
  cargando = false;

  page: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  searchTerm: string = '';
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private entradaService: EntradaService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term;
      this.page = 0;
      this.cargarEntradasPendientes();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openModal(): void {
    this.visible = true;
    this.page = 0;
    this.searchTerm = '';
    this.cargarEntradasPendientes();
  }

  handleVisibleChange(event: boolean) {
    this.visible = event;
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  onPageChange(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.cargarEntradasPendientes();
    }
  }

  getBestDate(entrada: Entrada): Date {
    return entrada.fechaEdicion || entrada.fechaPublicacion || entrada.fechaPublicacionProgramada;
  }

  cargarEntradasPendientes(): void {
    this.cargando = true;
    this.cdr.markForCheck();

    const criteriaList = [
      {
        filterKey: 'estadoEntrada.nombre',
        value: 'PENDIENTE REVISION',
        operation: 'EQUAL',
        clazzName: 'Entrada',
      }
    ];

    if (this.searchTerm) {
      criteriaList.push({
        filterKey: 'titulo',
        value: this.searchTerm,
        operation: 'CN', // Contains
        clazzName: 'Entrada',
      });
    }

    const searchRequest = {
      dataOption: 'AND',
      searchCriteriaList: criteriaList,
    };

    this.entradaService
      .buscarSafe(searchRequest, this.page, this.pageSize)
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.entradas = response.elements;
          this.totalPages = response.totalPages;
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
