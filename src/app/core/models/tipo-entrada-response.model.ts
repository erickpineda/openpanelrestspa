import { TipoEntrada } from './tipo-entrada.model';

export class TipoEntradaResponse {
  tiposEntradas: TipoEntrada[] = [];

  constructor() {}
}

export interface TipoEntradaResponse {
  tiposEntradas: TipoEntrada[];
}
