import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { BaseService } from '../../_utils/base.service';
import { TemaPreset } from '../../models/tema-preset.model';
import { SKIP_GLOBAL_LOADER } from '../../interceptor/network.interceptor';

@Injectable({ providedIn: 'root' })
export class TemaPresetsService extends BaseService {
  private endpoint = '/config/temas/presets';

  listar(context?: HttpContext): Observable<TemaPreset[]> {
    const ctx = context ?? new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    return this.safeGetData<TemaPreset[]>(
      `${this.endpoint}`,
      [],
      undefined,
      undefined,
      'temaPresets.listar',
      ctx
    );
  }

  crear(dto: Partial<TemaPreset>, context?: HttpContext): Observable<TemaPreset> {
    return this.safePostData<TemaPreset>(
      `${this.endpoint}`,
      dto,
      {} as TemaPreset,
      undefined,
      undefined,
      'temaPresets.crear',
      context
    );
  }

  actualizar(id: number, dto: Partial<TemaPreset>, context?: HttpContext): Observable<TemaPreset> {
    return this.safePutData<TemaPreset>(
      `${this.endpoint}/${id}`,
      dto,
      {} as TemaPreset,
      undefined,
      undefined,
      'temaPresets.actualizar',
      context
    );
  }

  borrar(id: number, context?: HttpContext): Observable<boolean> {
    return this.safeDeleteOperation(
      `${this.endpoint}/${id}`,
      undefined,
      undefined,
      'temaPresets.borrar',
      context
    );
  }
}

