// entrada-facade.service.ts
import { Injectable } from '@angular/core';
import { forkJoin, Observable, map, catchError, of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { EntradaService } from '../../../../../core/services/data/entrada.service';
import { CategoriaService } from '../../../../../core/services/data/categoria.service';
import { UsuarioService } from '../../../../../core/services/data/usuario.service';
import { OpenpanelApiResponse } from '../../../../../core/models/openpanel-api-response.model';
import { Usuario } from '../../../../../core/models/usuario.model';
import { TipoEntrada } from '../../../../../core/models/tipo-entrada.model';
import { EstadoEntrada } from '../../../../../core/models/estado-entrada.model';
import { Categoria } from '../../../../../core/models/categoria.model';
import { PerfilResponse } from '../../../../../core/models/perfil-response.model';

@Injectable({
  providedIn: 'root',
})
export class EntradaFacadeService {
  private usuarioSesion: any | null = null;

  constructor(
    private entradaService: EntradaService,
    private categoriaService: CategoriaService,
    private usuarioService: UsuarioService
  ) {}

  // Carga inicial: tipos, estados, categorias en paralelo
  async loadInitData(): Promise<{ 
    tipos: TipoEntrada[]; 
    estados: EstadoEntrada[]; 
    categorias: Categoria[];
    usuarioActual: string;
  }> {
    const [tipos, estados, categorias, usuario] = await Promise.all([
      firstValueFrom(this.entradaService.listarTiposEntradasSafe()),
      firstValueFrom(this.entradaService.listarEstadosEntradasSafe()),
      firstValueFrom(this.categoriaService.listarSafe()),
      this.usuarioService.getUsernameActual() // ✅ Ahora es seguro
    ]);

    return {
      tipos,
      estados, 
      categorias,
      usuarioActual: usuario
    };
  }

  // Devuelve observable de la entrada por id
  cargarEntradaPorId(id: number): Observable<any> {
    return this.entradaService.obtenerPorIdSafe(id);
  }

  crearEntrada(ent: any): Observable<any> {
    return this.entradaService.crear(ent);
  }

  actualizarEntrada(id: any, ent: any): Observable<any> {
    return this.entradaService.actualizarSafe(id, ent);
  }

  async getUsuarioSesion(): Promise<PerfilResponse> {
    if (this.usuarioSesion) return this.usuarioSesion;
    const resp = await firstValueFrom(
      this.usuarioService.obtenerDatosSesionActualSafe()
    );
    this.usuarioSesion = resp ?? null;
    return this.usuarioSesion;
  }
}
