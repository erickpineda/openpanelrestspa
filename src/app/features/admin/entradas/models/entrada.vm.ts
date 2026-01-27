import { Entrada } from '@app/core/models/entrada.model';

export interface EntradaVM extends Entrada {
  categoriasConComas: string;
}
