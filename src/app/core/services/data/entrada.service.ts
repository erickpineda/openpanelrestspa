// core/services/data/entrada.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';
import { map } from 'rxjs/operators';
import { Entrada } from '../../models/entrada.model';
import { TipoEntrada } from '../../models/tipo-entrada.model';
import { EstadoEntrada } from '../../models/estado-entrada.model';
import { CrudService } from '../../_utils/crud.service';
import { OPConstants } from 'src/app/shared/constants/op-global.constants';

// Interfaces para las respuestas específicas
interface TiposEntradasResponse {
  tiposEntradas: TipoEntrada[];
}

interface EstadosEntradasResponse {
  estadosEntradas: EstadoEntrada[];
}

interface BuscarResponse {
  elements: Entrada[];
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class EntradaService extends CrudService<Entrada, number> {
  protected endpoint = OPConstants.Methods.ENTRADAS.BASE;

  // ✅ MÉTODOS SEGUROS ESPECÍFICOS (nuevos)

  /**
   * Obtiene tipos de entrada de forma segura
   */
  listarTiposEntradasSafe(): Observable<TipoEntrada[]> {
    return this.safeGetData<TiposEntradasResponse>(
      `${this.endpoint}/tiposEntradas`,
      { tiposEntradas: [] },
      undefined,
      undefined,
      'entradas.tiposEntradas'
    ).pipe(map((response) => response.tiposEntradas));
  }

  /**
   * Obtiene estados de entrada de forma segura
   */
  listarEstadosEntradasSafe(): Observable<EstadoEntrada[]> {
    return this.safeGetData<EstadosEntradasResponse>(
      `${this.endpoint}/estadosEntradas`,
      { estadosEntradas: [] },
      undefined,
      undefined,
      'entradas.estadosEntradas'
    ).pipe(map((response) => response.estadosEntradas));
  }

  /**
   * Busca entradas de forma segura
   */
  buscarSafe(
    searchRequest: any,
    page: number,
    size: number,
    sortField?: string,
    sortDirection?: string
  ): Observable<BuscarResponse> {
    let params: any = { pageNo: page.toString(), pageSize: size.toString() };
    if (sortField) {
      params['sortBy'] = sortField;
      // Also add standard spring sort
      params['sort'] = `${sortField},${sortDirection || 'ASC'}`;
    }
    if (sortDirection) {
      params['sortDirection'] = sortDirection;
    }

    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.safePostData<BuscarResponse>(
      `${this.endpoint}/buscar`,
      searchRequest,
      { elements: [], totalPages: 0 },
      params,
      undefined,
      'entradas.buscar',
      context
    );
  }

  /**
   * Obtiene definiciones del buscador de forma segura
   */
  obtenerDefinicionesBuscadorSafe(): Observable<any> {
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.safeGetData<any>(
      `${this.endpoint}/buscar/definicionesBuscador`,
      {},
      undefined,
      undefined,
      'entradas.definicionesBuscador',
      context
    );
  }

  // ✅ MÉTODOS ORIGINALES (mantener exactamente como están)

  listarTiposEntradas(): Observable<any> {
    return this.get(`${this.endpoint}/tiposEntradas`);
  }

  listarEstadosEntradas(): Observable<any> {
    return this.get(`${this.endpoint}/estadosEntradas`);
  }

  buscar(
    searchRequest: any,
    page: number,
    size: number,
    sortField?: string,
    sortDirection?: string
  ): Observable<any> {
    let params: any = { pageNo: page.toString(), pageSize: size.toString() };
    if (sortField) {
      params['sortBy'] = sortField;
    }
    if (sortDirection) {
      params['sortDirection'] = sortDirection;
    }
    return this.post(`${this.endpoint}/buscar`, searchRequest, params);
  }

  obtenerDefinicionesBuscador(): Observable<any> {
    return this.get(OPConstants.Methods.ENTRADAS.BUSCAR_DEFINICIONES);
  }

  obtenerPorSlug(slug: string): Observable<any> {
    return this.get(OPConstants.Methods.ENTRADAS.OBTENER_POR_SLUG(slug));
  }

  // ... mantener todos tus otros métodos existentes
}
