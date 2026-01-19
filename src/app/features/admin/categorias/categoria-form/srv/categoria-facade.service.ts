import { Injectable } from '@angular/core';
import { Observable, map, catchError, of, forkJoin } from 'rxjs';
import { Categoria } from '@app/core/models/categoria.model';
import { Entrada } from '@app/core/models/entrada.model';
import { PerfilResponse } from '@app/core/models/perfil-response.model';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { UsuarioService } from '@app/core/services/data/usuario.service';
import { CategoriaService } from '@app/core/services/data/categoria.service';

@Injectable({ providedIn: 'root' })
export class CategoriaFacadeService {
  constructor(
    private categoriaService: CategoriaService,
    private usuarioService: UsuarioService,
    private entradaService: EntradaService
  ) {}

  obtenerListaCategorias(): Observable<Categoria[]> {
    return this.categoriaService.listarPagina().pipe(
      map((resp) => (Array.isArray(resp.data?.elements) ? resp.data.elements : [])),
      catchError(() => of([]))
    );
  }

  obtenerCategoriaPorId(id: number): Observable<Categoria | null> {
    return this.categoriaService.obtenerPorId(id).pipe(
      map((resp) => (resp.data ? resp.data : null)),
      catchError(() => of(null))
    );
  }

  obtenerCategoriaPorCodigo(codigo: string): Observable<Categoria | null> {
    return this.categoriaService.obtenerPorCodigo(codigo).pipe(
      map((resp) => (resp.data ? resp.data : null)),
      catchError(() => of(null))
    );
  }

  obtenerUsuarioActual(): Observable<PerfilResponse | null> {
    return this.usuarioService.obtenerDatosSesionActual().pipe(
      map((resp) => (resp.data ? resp.data : null)),
      catchError(() => of(null))
    );
  }

  obtenerEntradaPorId(id: number): Observable<Entrada | null> {
    return this.entradaService.obtenerPorId(id).pipe(
      map((resp) => (resp.data ? resp.data : null)),
      catchError(() => of(null))
    );
  }

  cargarDatosParaEdicion(
    idCategoria: number,
    idEntrada: number
  ): Observable<{
    categoria: Categoria | null;
    usuario: PerfilResponse | null;
    entrada: Entrada | null;
  }> {
    return forkJoin({
      categoria: this.obtenerCategoriaPorId(idCategoria),
      usuario: this.obtenerUsuarioActual(),
      entrada: this.obtenerEntradaPorId(idEntrada),
    });
  }

  crearCategoria(cat: Categoria) {
    return this.categoriaService.crear(cat);
  }

  actualizarCategoria(id: number, cat: Categoria) {
    return this.categoriaService.actualizar(id, cat);
  }

  actualizarCategoriaPorCodigo(codigo: string, cat: Categoria) {
    return this.categoriaService.actualizarPorCodigo(codigo, cat);
  }
}
