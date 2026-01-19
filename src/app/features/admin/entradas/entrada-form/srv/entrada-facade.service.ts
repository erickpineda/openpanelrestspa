import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { TipoEntrada } from '@app/core/models/tipo-entrada.model';
import { EstadoEntrada } from '@app/core/models/estado-entrada.model';
import { Categoria } from '@app/core/models/categoria.model';
import { Entrada } from '@app/core/models/entrada.model';
import { CategoriaService } from '@app/core/services/data/categoria.service';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { UsuarioService } from '@app/core/services/data/usuario.service';
import { EtiquetaService } from '@app/core/services/data/etiqueta.service';

@Injectable({ providedIn: 'root' })
export class EntradaFacadeService {
  private usuarioSesion: any | null = null;

  constructor(
    private catSrv: CategoriaService,
    private entradaSrv: EntradaService,
    private usuarioService: UsuarioService,
    private etiquetaSrv: EtiquetaService,
  ) {}
  loadInitData(): Promise<{ tipos: TipoEntrada[]; estados: EstadoEntrada[]; categorias: Categoria[]; etiquetas: any[] }> {
    return firstValueFrom(
      forkJoin({
        tipos: this.entradaSrv.listarTiposEntradasSafe(),
        estados: this.entradaSrv.listarEstadosEntradasSafe(),
        categorias: this.catSrv.listarSafe(0, 50),
        etiquetas: this.etiquetaSrv.listarSafe(0, 50),
      }).pipe(map(({ tipos, estados, categorias, etiquetas }) => ({ tipos, estados, categorias, etiquetas })))
    );
  }

  async getUsuarioSesion(): Promise<any> {
    if (this.usuarioSesion) {
      return this.usuarioSesion;
    }
    const perfil = await firstValueFrom(this.usuarioService.obtenerDatosSesionActualSafe());
    this.usuarioSesion = perfil ?? null;
    return this.usuarioSesion;
  }
  crearEntrada(ent: any): Observable<any> {
    return this.entradaSrv.crear(ent);
  }
  actualizarEntrada(id: number, ent: any): Observable<any> {
    return this.entradaSrv.actualizar(id, ent);
  }
  cargarEntradaPorId(id: number): Observable<Entrada> {
    return this.entradaSrv.obtenerPorId(id).pipe(map((r: any) => r?.data as Entrada));
  }
}
