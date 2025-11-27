import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { EntradaService } from './entrada.service';
import { CategoriaService } from './categoria.service';
import { EtiquetaService } from './etiqueta.service';

@Injectable({
  providedIn: 'root'
})
export class EntradaCatalogService {
  private cache: { [key: string]: string[] } | null = null;

  constructor(
    private entradaService: EntradaService,
    private categoriaService: CategoriaService,
    private etiquetaService: EtiquetaService
  ) {}

  /**
   * Devuelve los catálogos relevantes para Entradas mapeados a arrays de nombres.
   * Cached after first successful fetch.
   */
  obtenerCatalogosEntrada(): Observable<{ [key: string]: string[] }> {
    if (this.cache) return of(this.cache);

    const tipos$ = this.entradaService.listarTiposEntradasSafe();
    const estados$ = this.entradaService.listarEstadosEntradasSafe();
    const categorias$ = this.categoriaService.listarSafe();
    const etiquetas$ = this.etiquetaService.listarSafe();

    return forkJoin([tipos$, estados$, categorias$, etiquetas$]).pipe(
      map(([tipos, estados, categorias, etiquetas]) => {
        const mapped: { [key: string]: string[] } = {
          'tipoEntrada.nombre': Array.isArray(tipos) ? tipos.map((t: any) => t.nombre) : [],
          'estadoEntrada.nombre': Array.isArray(estados) ? estados.map((e: any) => e.nombre) : [],
          'categoria.nombre': Array.isArray(categorias) ? categorias.map((c: any) => c.nombre) : [],
          'etiqueta.nombre': Array.isArray(etiquetas) ? etiquetas.map((t: any) => t.nombre) : []
        };
        this.cache = mapped;
        return mapped;
      })
    );
  }

  clearCache(): void {
    this.cache = null;
  }
}
