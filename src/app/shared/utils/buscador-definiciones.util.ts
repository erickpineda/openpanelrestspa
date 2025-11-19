// Utilidad para adaptar y traducir definiciones del backend para el BuscadorAvanzadoComponent
// Esta versión es tolerante al wrapper de respuesta ({ result, data }) y añade
// mapeo de operaciones cortas -> tokens del backend. Devuelve también metadatos útiles.

import { traducirCampoPorEntidad } from './buscador-traducciones.util';

const TRADUCCIONES_OPERACIONES: Record<string, string> = {
  'CONTAINS': 'Contiene',
  'DOES_NOT_CONTAIN': 'No contiene',
  'EQUAL': 'Igual a',
  'NOT_EQUAL': 'Distinto de',
  'BEGINS_WITH': 'Comienza con',
  'DOES_NOT_BEGIN_WITH': 'No comienza con',
  'ENDS_WITH': 'Termina con',
  'DOES_NOT_END_WITH': 'No termina con',
  'NULL': 'Vacío',
  'NOT_NULL': 'No vacío',
  'GREATER_THAN': 'Mayor que',
  'GREATER_THAN_EQUAL': 'Mayor o igual que',
  'LESS_THAN': 'Menor que',
  'LESS_THAN_EQUAL': 'Menor o igual que',
  'BOOLEAN': 'Sí/No',
};

// Mapeo de códigos cortos (frontend o ejemplos) a tokens esperados por el backend
const SHORT_TO_TOKEN: Record<string, string> = {
  'cn': 'CONTAINS',
  'nc': 'DOES_NOT_CONTAIN',
  'eq': 'EQUAL',
  'ne': 'NOT_EQUAL',
  'bw': 'BEGINS_WITH',
  'nbw': 'DOES_NOT_BEGIN_WITH',
  'ew': 'ENDS_WITH',
  'new': 'DOES_NOT_END_WITH',
  'nu': 'NULL',
  'nn': 'NOT_NULL',
  'gt': 'GREATER_THAN',
  'ge': 'GREATER_THAN_EQUAL',
  'lt': 'LESS_THAN',
  'le': 'LESS_THAN_EQUAL',
  'bool': 'BOOLEAN'
};

export interface BuscadorCampoDef {
  key: string;
  label: string;
  operaciones: { value: string; label: string }[];
}

export interface BuscadorDefinicionesAdaptadas {
  campos: BuscadorCampoDef[];
  dataOptionPermitido?: string[];
  valuePermitido?: string[];
  clazzNamePermitido?: string[];
  indicaciones?: string[];
  ejemplo?: any;
}

function normalizeOperation(op: string | null | undefined): string | undefined {
  if (!op) return undefined;
  // Si ya viene en mayúsculas y en el diccionario, asumir que es token
  if (TRADUCCIONES_OPERACIONES[op]) return op;
  const lower = op.toLowerCase();
  return SHORT_TO_TOKEN[lower] || undefined;
}

export function getBuscadorDefinicionesAmigables(defs: any, opciones?: {
  camposMostrar?: string[]; // Si quieres limitar los campos
  camposOrden?: string[];   // Si quieres forzar un orden
}): BuscadorDefinicionesAdaptadas {
  if (!defs) return { campos: [] };
  // Aceptar tanto el objeto completo ({result, data}) como directamente el `data`
  const d = defs.data ? defs.data : defs;

  const filterKeys: string[] = d.filterKeySegunClazzNamePermitido || [];
  const opPermitido = d.operationPermitido || {};

  let campos = Array.isArray(filterKeys) ? filterKeys.slice() : [];
  // Filtrar si se indica
  if (opciones?.camposMostrar) {
    campos = campos.filter(c => opciones.camposMostrar!.includes(c));
  }
  // Ordenar si se indica
  if (opciones?.camposOrden) {
    campos = opciones.camposOrden.concat(campos.filter(c => !opciones.camposOrden!.includes(c)));
  }

  // Mapear a estructura amigable
  const camposAdaptados: BuscadorCampoDef[] = campos.map(key => {
    const opsRaw: string[] = opPermitido[key] || [];
    const operaciones = opsRaw.map((op: string) => ({
      value: op,
      label: TRADUCCIONES_OPERACIONES[op] || op
    }));
    return {
      key,
      label: traducirCampoPorEntidad(key, d.clazzNamePermitido) || key,
      operaciones
    };
  });

  const adapted: BuscadorDefinicionesAdaptadas = {
    campos: camposAdaptados,
    dataOptionPermitido: d.dataOptionPermitido,
    valuePermitido: d.valuePermitido,
    clazzNamePermitido: d.clazzNamePermitido,
    indicaciones: d.indicaciones,
    ejemplo: d.ejemplo
  };

  // Normalizar ejemplo.searchCriteriaList (si existe) para que use tokens del backend
  if (adapted.ejemplo && Array.isArray(adapted.ejemplo.searchCriteriaList)) {
    adapted.ejemplo = { ...adapted.ejemplo, searchCriteriaList: adapted.ejemplo.searchCriteriaList.map((sc: any) => ({
      ...sc,
      operation: normalizeOperation(sc.operation) || sc.operation
    })) };
  }

  return adapted;
}
