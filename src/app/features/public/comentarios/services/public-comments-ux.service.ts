import { Injectable } from '@angular/core';
import { OPConstants } from '@shared/constants/op-global.constants';

export type PublicCommentsUxStrategy = 'TOTAL_WITH_MESSAGE' | 'SYNCED';

@Injectable({
  providedIn: 'root',
})
export class PublicCommentsUxService {
  readonly strategy: PublicCommentsUxStrategy;
  readonly useRecuentosEndpoint: boolean;
  readonly pendingNoticeTtlMs: number;

  constructor() {
    const configured = (OPConstants as any)?.App?.Public?.Comentarios?.UX_STRATEGY;
    this.strategy = configured === 'TOTAL_WITH_MESSAGE' ? 'TOTAL_WITH_MESSAGE' : 'SYNCED';

    const useCounts = (OPConstants as any)?.App?.Public?.Comentarios?.USE_RECUENTOS_ENDPOINT;
    this.useRecuentosEndpoint = useCounts === true;

    const ttl = Number((OPConstants as any)?.App?.Public?.Comentarios?.PENDING_NOTICE_TTL_MS);
    this.pendingNoticeTtlMs = Number.isFinite(ttl) && ttl > 0 ? ttl : 259200000;
  }
}
