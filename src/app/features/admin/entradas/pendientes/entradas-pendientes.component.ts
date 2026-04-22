import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { Entrada } from '@app/core/models/entrada.model';
import { SearchQuery } from '@app/shared/models/search.models';

@Component({
  selector: 'app-entradas-pendientes',
  templateUrl: './entradas-pendientes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EntradasPendientesComponent implements OnInit, OnDestroy {
  visible = false;
  entradas: Entrada[] = [];
  cargando = false;

  page = 0;
  pageSize = 10;
  totalPages = 0;
  searchTerm = '';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private entradaService: EntradaService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
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

  handleVisibleChange(event: boolean): void {
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
    return (
      (entrada as any).fechaEdicion ||
      (entrada as any).fechaPublicacion ||
      (entrada as any).fechaPublicacionProgramada
    );
  }

  cargarEntradasPendientes(): void {
    this.cargando = true;
    this.cdr.markForCheck();

    const children: any[] = [
      {
        type: 'condition',
        field: 'estadoEntrada.nombre',
        op: 'equal',
        value: 'PENDIENTE REVISION',
      },
    ];

    if (this.searchTerm) {
      children.push({
        type: 'condition',
        field: 'titulo',
        op: 'contains',
        value: this.searchTerm,
      });
    }

    const searchRequest: SearchQuery = {
      node: children.length === 1 ? children[0] : { type: 'group', op: 'AND', children },
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
        next: (response: any) => {
          this.entradas = response?.elements || [];
          this.totalPages = response?.totalPages ?? 0;
        },
        error: (err) => {
          console.error('Error loading pending entries', err);
        },
      });
  }

  irAEditar(id: number): void {
    this.visible = false;
    setTimeout(() => {
      const entrada = this.entradas.find((e) => e.idEntrada === id);
      const slug = entrada?.slug;
      if (slug) {
        this.router.navigate(['/admin/control/entradas/editar/slug', slug]);
      }
    }, 350);
  }
}
