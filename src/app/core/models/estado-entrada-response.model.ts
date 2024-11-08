import { EstadoEntrada } from "./estado-entrada.model";

export class EstadoEntradaResponse {
  estadosEntradas: EstadoEntrada[] = [];
  
  constructor() {

  }
}

export interface EstadoEntradaResponse {
  estadosEntradas: EstadoEntrada[];
}