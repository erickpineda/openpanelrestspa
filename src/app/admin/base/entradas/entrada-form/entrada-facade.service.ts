// entrada-facade.service.ts
import { Injectable } from '@angular/core';
import { forkJoin, Observable, map } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { EntradaService } from '../../../../core/services/entrada.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { OpenpanelApiResponse } from '../../../../core/models/openpanel-api-response.model';

@Injectable({
  providedIn: 'root'
})
export class EntradaFacadeService {
  private usuarioSesion: any | null = null;

  constructor(
    private entradaService: EntradaService,
    private categoriaService: CategoriaService,
    private usuarioService: UsuarioService
  ) {}

  // Carga inicial: tipos, estados, categorias en paralelo
  async loadInitData(): Promise<{ tipos: any[]; estados: any[]; categorias: any[] }> {
    const reqs = forkJoin({
      tipos: this.entradaService.listarTiposEntradas(),
      estados: this.entradaService.listarEstadosEntradas(),
      categorias: this.categoriaService.listar()
    });

    const resp: any = await firstValueFrom(reqs);

    return {
      tipos: resp.tipos?.data?.tiposEntradas ?? [],
      estados: resp.estados?.data?.estadosEntradas ?? [],
      categorias: resp.categorias?.data?.elements ?? []
    };
  }

  // Devuelve observable de la entrada por id
  cargarEntradaPorId(id: number): Observable<any> {
    return this.entradaService.obtenerPorId(id).pipe(
      map((r: OpenpanelApiResponse<any>) => r.data ?? null)
    );
  }

  crearEntrada(ent: any): Observable<any> {
    return this.entradaService.crear(ent);
  }

  actualizarEntrada(id: any, ent: any): Observable<any> {
    return this.entradaService.actualizar(id, ent);
  }

  async getUsuarioSesion(): Promise<any> {
    if (this.usuarioSesion) return this.usuarioSesion;
    const resp = await firstValueFrom(this.usuarioService.obtenerDatosSesionActual());
    this.usuarioSesion = resp?.data ?? null;
    return this.usuarioSesion;
  }
}
