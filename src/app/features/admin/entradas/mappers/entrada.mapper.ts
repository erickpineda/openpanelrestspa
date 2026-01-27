import { Entrada } from '@app/core/models/entrada.model';
import { Categoria } from '@app/core/models/categoria.model';
import { EntradaVM } from '../models/entrada.vm';

export function mapEntradaComputed(entrada: Entrada): EntradaVM {
  const categoriasConComas = entrada.categorias?.map((e: Categoria) => e.nombre).join(', ') || '';
  return {
    ...entrada,
    categoriasConComas,
  } as EntradaVM;
}

export function mapEntradasComputed(entradas: Entrada[]): EntradaVM[] {
  return (entradas || []).map(mapEntradaComputed);
}
