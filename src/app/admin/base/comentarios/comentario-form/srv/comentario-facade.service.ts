import { Injectable } from '@angular/core';
import { Observable, map, catchError, of, forkJoin } from 'rxjs';
import { Comentario } from '../../../../../core/models/comentario.model';
import { Entrada } from '../../../../../core/models/entrada.model';
import { PerfilResponse } from '../../../../../core/models/perfil-response.model';
import { ComentarioService } from '../../../../../core/services/data/comentario.service';
import { UsuarioService } from '../../../../../core/services/data/usuario.service';
import { EntradaService } from '../../../../../core/services/data/entrada.service';
import { OpenpanelApiResponse } from '../../../../../core/models/openpanel-api-response.model';

@Injectable({ providedIn: 'root' })
export class ComentarioFacadeService {
  constructor(
    private comentarioService: ComentarioService,
    private usuarioService: UsuarioService,
    private entradaService: EntradaService
  ) {}

  obtenerComentarioPorId(id: number): Observable<Comentario | null> {
    return this.comentarioService.obtenerPorId(id).pipe(
      map((resp: OpenpanelApiResponse<Comentario>) => (resp.data ? resp.data : null)),
      catchError(() => of(null))
    );
  }

  obtenerUsuarioActual(): Observable<PerfilResponse | null> {
    return this.usuarioService.obtenerDatosSesionActual().pipe(
      map((resp: OpenpanelApiResponse<PerfilResponse>) => (resp.data ? resp.data : null)),
      catchError(() => of(null))
    );
  }

  obtenerUsuarioPorId(id: number): Observable<PerfilResponse | null> {
    return this.usuarioService.obtenerPorId(id).pipe(
      map((resp: OpenpanelApiResponse<PerfilResponse>) => (resp.data ? resp.data : null)),
      catchError(() => of(null))
    );
  }

  obtenerEntradaPorId(id: number): Observable<Entrada | null> {
    return this.entradaService.obtenerPorId(id).pipe(
      map((resp: OpenpanelApiResponse<Entrada>) => (resp.data ? resp.data : null)), // Fix: EntradaService usually returns single object or elements
      catchError(() => of(null))
    );
  }

  // Carga datos para editar: comentario y sus relaciones (usuario, entrada)
  cargarDatosParaEdicion(
    idComentario: number
  ): Observable<{
    comentario: Comentario | null;
    usuario: PerfilResponse | null;
    entrada: Entrada | null;
  }> {
      // First get the comment to know which entry/user it belongs to
      // But for now, let's just get the comment. 
      // The current implementation in EditarComentarioComponent loads comment, then entry/user details if needed.
      // However, the form mainly needs the comment data.
      // If we need extra data (like entry title), we might need to chain calls.
      
      return this.obtenerComentarioPorId(idComentario).pipe(
          map(comentario => ({
              comentario,
              usuario: null, // We might fetch this if needed, but usually contained in comment DTO or we fetch separately
              entrada: null // Same here
          }))
      );
  }

  crearComentario(comentario: Comentario): Observable<any> {
    return this.comentarioService.crear(comentario);
  }

  actualizarComentario(id: number, comentario: Comentario): Observable<any> {
    return this.comentarioService.actualizar(id, comentario);
  }

  buscarEntradas(term: string): Observable<Entrada[]> {
    const searchRequest = {
      dataOption: 'AND',
      searchCriteriaList: [
        {
          filterKey: 'titulo',
          value: term,
          operation: 'CONTAINS',
          clazzName: 'Entrada',
        },
      ],
    };
    return this.entradaService.buscarSafe(searchRequest, 0, 10).pipe(
        map(resp => resp.elements || [])
    );
  }
}
