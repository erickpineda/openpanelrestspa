export class CambiarEstadoEntradaReq {
  idEntrada: number = 0;
  idUsuarioEditado: number = 0;
  idEstadoEntrada: number = 0;

  constructor() {

  }
}

export interface CambiarEstadoEntradaReq {
  idEntrada: number;
  idUsuarioEditado: number;
  idEstadoEntrada: number;
}