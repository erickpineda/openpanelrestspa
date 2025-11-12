// core/services/data/entrada.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Entrada } from '../../models/entrada.model';
import { TipoEntrada } from '../../models/tipo-entrada.model';
import { EstadoEntrada } from '../../models/estado-entrada.model';
import { CrudService } from '../../_utils/crud.service';

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
  providedIn: 'root'
})
export class EntradaService extends CrudService<Entrada, number> {
  protected endpoint = '/entradas';

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
    ).pipe(
      map(response => response.tiposEntradas)
    );
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
    ).pipe(
      map(response => response.estadosEntradas)
    );
  }

  /**
   * Busca entradas de forma segura
   */
  buscarSafe(searchRequest: any, page: number, size: number): Observable<BuscarResponse> {
    const params = { page: page.toString(), size: size.toString() };
    return this.safePostData<BuscarResponse>(
      `${this.endpoint}/buscar`,
      searchRequest,
      { elements: [], totalPages: 0 },
      params,
      undefined,
      'entradas.buscar'
    );
  }

  /**
   * Obtiene definiciones del buscador de forma segura
   */
  obtenerDefinicionesBuscadorSafe(): Observable<any> {
    return this.safeGetData<any>(
      `${this.endpoint}/buscar/definicionesBuscador`,
      {},
      undefined,
      undefined,
      'entradas.definicionesBuscador'
    );
  }

  // ✅ MÉTODOS ORIGINALES (mantener exactamente como están)

  listarTiposEntradas(): Observable<any> {
    return this.get(`${this.endpoint}/tiposEntradas`);
  }

  listarEstadosEntradas(): Observable<any> {
    return this.get(`${this.endpoint}/estadosEntradas`);
  }

  buscar(searchRequest: any, page: number, size: number): Observable<any> {
    const params = { page: page.toString(), size: size.toString() };
    return this.post(`${this.endpoint}/buscar`, searchRequest, params);
  }

  obtenerDefinicionesBuscador(): Observable<any> {
    return this.get(`${this.endpoint}/buscar/definicionesBuscador`);
  }

  // ... mantener todos tus otros métodos existentes
}