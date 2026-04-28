import { Injectable } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Comentario } from '@app/core/models/comentario.model';
import { Entrada } from '@app/core/models/entrada.model';
import { PerfilResponse } from '@app/core/models/perfil-response.model';
import { ComentarioService } from '@app/core/services/data/comentario.service';
import { UsuarioService } from '@app/core/services/data/usuario.service';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { OpenpanelApiResponse } from '@app/core/models/openpanel-api-response.model';
import { SearchQuery } from '@app/shared/models/search.models';

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
    return this.usuarioService.obtenerDatosSesionActualSafe().pipe(
      map((perfil: PerfilResponse) => perfil ?? null),
      catchError(() => of(null))
    );
  }

  obtenerUsuarioPorId(id: number): Observable<PerfilResponse | null> {
    return this.usuarioService.obtenerPorId(id).pipe(
      map((resp: OpenpanelApiResponse<PerfilResponse>) => (resp.data ? resp.data : null)),
      catchError(() => of(null))
    );
  }

  obtenerUsuarioPorUsername(username: string): Observable<PerfilResponse | null> {
    return this.usuarioService.obtenerPorUsernameSafe(username).pipe(
      map((usuario: any) => (usuario ? usuario : null)),
      catchError(() => of(null))
    );
  }

  obtenerEntradaPorId(id: number): Observable<Entrada | null> {
    return this.entradaService.obtenerPorId(id).pipe(
      map((resp: OpenpanelApiResponse<Entrada>) => (resp.data ? resp.data : null)),
      catchError(() => of(null))
    );
  }

  cargarDatosParaEdicion(idComentario: number): Observable<{
    comentario: Comentario | null;
    usuario: PerfilResponse | null;
    entrada: Entrada | null;
  }> {
    return this.obtenerComentarioPorId(idComentario).pipe(
      map((comentario) => ({
        comentario,
        usuario: null,
        entrada: null,
      }))
    );
  }

  crearComentario(comentario: Comentario, context?: HttpContext): Observable<any> {
    return this.comentarioService.crear(comentario, context);
  }

  actualizarComentario(id: number, comentario: Comentario, context?: HttpContext): Observable<any> {
    return this.comentarioService.actualizar(id, comentario, context);
  }

  buscarEntradas(term: string): Observable<Entrada[]> {
    const searchRequest: SearchQuery = {
      node: { type: 'condition', field: 'titulo', op: 'contains', value: term },
    };
    return this.entradaService
      .buscarSafe(searchRequest, 0, 10)
      .pipe(map((resp: any) => resp.elements || []));
  }
}
