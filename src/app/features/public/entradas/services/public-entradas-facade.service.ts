import { Injectable } from '@angular/core';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { PublicEntradasStateService } from './public-entradas-state.service';
import { finalize } from 'rxjs/operators';
import { SearchQuery } from '@app/shared/models/search.models';

@Injectable({
  providedIn: 'root',
})
export class PublicEntradasFacadeService {
  constructor(
    private entradaService: EntradaService,
    private state: PublicEntradasStateService
  ) {}

  get loading$() {
    return this.state.loading$;
  }
  get entradas$() {
    return this.state.entradas$;
  }

  get totalPages$() {
    return this.state.totalPages$;
  }

  buscarEntradasPublicas(
    page: number = 0,
    size: number = 10,
    sortField: string = 'fechaPublicacion',
    sortDirection: 'ASC' | 'DESC' = 'DESC',
    searchText?: string,
    permitirComentario?: boolean,
    categoriasNombres?: string[],
    etiquetasNombres?: string[]
  ) {
    this.state.setLoading(true);

    const categoriasLimpias = Array.isArray(categoriasNombres)
      ? [...new Set(categoriasNombres.map((c) => String(c || '').trim()).filter((c) => c.length > 0))]
      : [];
    const etiquetasLimpias = Array.isArray(etiquetasNombres)
      ? [...new Set(etiquetasNombres.map((t) => String(t || '').trim()).filter((t) => t.length > 0))]
      : [];

    const children: any[] = [
      { type: 'condition', field: 'publicada', op: 'equal', value: true },
      ...(permitirComentario === true
        ? [{ type: 'condition', field: 'permitirComentario', op: 'equal', value: true }]
        : []),
      ...(searchText && searchText.trim().length > 0
        ? [
            {
              type: 'condition',
              field: 'titulo',
              op: 'contains',
              value: searchText.trim(),
            },
          ]
        : []),
      ...categoriasLimpias.map((categoria) => ({
        type: 'condition',
        field: 'categoria.nombre',
        op: 'equal',
        value: categoria,
      })),
      ...etiquetasLimpias.map((etiqueta) => ({
        type: 'condition',
        field: 'etiqueta.nombre',
        op: 'equal',
        value: etiqueta,
      })),
    ];

    const searchRequest: SearchQuery = {
      node: children.length === 1 ? children[0] : { type: 'group', op: 'AND', children },
    };

    this.entradaService
      .buscarSafe(searchRequest, page, size, sortField, sortDirection)
      .pipe(finalize(() => this.state.setLoading(false)))
      .subscribe({
        next: (res) => {
          this.state.setEntradas(res.elements || []);
          this.state.setTotalPages((res as any)?.totalPages ?? 1);
        },
        error: (err) => {
          console.error('Error fetching public entradas', err);
          this.state.setEntradas([]);
          this.state.setTotalPages(1);
        },
      });
  }

  obtenerPorSlug(slug: string) {
    return this.entradaService.obtenerPorSlug(slug);
  }
}
