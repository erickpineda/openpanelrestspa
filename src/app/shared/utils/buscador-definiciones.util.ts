// Utilidad para adaptar y traducir definiciones del backend para el BuscadorAvanzadoComponent.
//
// Soporta:
// - Contrato nuevo: SearchDefinitionsDTO { entity, version, fields[], example, hints }
// - (Fallback) Contrato antiguo v1: { filterKeySegunClazzNamePermitido, operationPermitido, ... }
//
// Es tolerante al wrapper de respuesta ({ result, data }).

import { traducirCampoPorEntidad } from './buscador-traducciones.util';
import { obtenerTipoCampoBuscador, TipoCampoBuscador } from './buscador-tipos-campos.util';
import { SearchDefinitions, SearchFieldDefinition, SearchQuery } from '../models/search.models';

const TRADUCCIONES_OPERACIONES: Record<string, string> = {
  // nombres largos (contrato nuevo)
  contains: 'Contiene',
  does_not_contain: 'No contiene',
  equal: 'Igual a',
  not_equal: 'Distinto de',
  begins_with: 'Comienza con',
  does_not_begin_with: 'No comienza con',
  ends_with: 'Termina con',
  does_not_end_with: 'No termina con',
  null: 'Vacío',
  not_null: 'No vacío',
  greater_than: 'Mayor que',
  greater_than_equal: 'Mayor o igual que',
  less_than: 'Menor que',
  less_than_equal: 'Menor o igual que',
  boolean: 'Sí/No',

  // compat: algunos sitios del frontend todavía usan tokens legacy en mayúsculas
  CONTAINS: 'Contiene',
  DOES_NOT_CONTAIN: 'No contiene',
  EQUAL: 'Igual a',
  NOT_EQUAL: 'Distinto de',
  BEGINS_WITH: 'Comienza con',
  DOES_NOT_BEGIN_WITH: 'No comienza con',
  ENDS_WITH: 'Termina con',
  DOES_NOT_END_WITH: 'No termina con',
  NULL: 'Vacío',
  NOT_NULL: 'No vacío',
  GREATER_THAN: 'Mayor que',
  GREATER_THAN_EQUAL: 'Mayor o igual que',
  LESS_THAN: 'Menor que',
  LESS_THAN_EQUAL: 'Menor o igual que',
  BOOLEAN: 'Sí/No',
};

// Mapeo de códigos cortos históricos a nombres largos (contrato nuevo).
const SHORT_TO_LONG: Record<string, string> = {
  cn: 'contains',
  nc: 'does_not_contain',
  eq: 'equal',
  ne: 'not_equal',
  bw: 'begins_with',
  bn: 'does_not_begin_with',
  nbw: 'does_not_begin_with',
  ew: 'ends_with',
  en: 'does_not_end_with',
  new: 'does_not_end_with',
  nu: 'null',
  nn: 'not_null',
  gt: 'greater_than',
  ge: 'greater_than_equal',
  lt: 'less_than',
  le: 'less_than_equal',
  bool: 'boolean',
 };

export interface BuscadorCampoDef {
  key: string;
  label: string;
  tipo: TipoCampoBuscador;
  operaciones: { value: string; label: string }[];
  enumValues?: string[];
  rawType?: string;
}

export interface BuscadorDefinicionesAdaptadas {
  campos: BuscadorCampoDef[];
  indicaciones?: string[];
  ejemplo?: SearchQuery | any;
  entity?: string;
  version?: string;
}

function normalizeOperation(op: string | null | undefined): string | undefined {
  if (!op) return undefined;
  // Si ya viene en el diccionario, ok (permite mayúsculas legacy y minúsculas nuevas)
  if (TRADUCCIONES_OPERACIONES[op]) return op;
  const lower = op.toLowerCase();
  return SHORT_TO_LONG[lower] || undefined;
}

export function getBuscadorDefinicionesAmigables(
  defs: any,
  opciones?: {
    camposMostrar?: string[]; // Si quieres limitar los campos
    camposOrden?: string[]; // Si quieres forzar un orden
  }
): BuscadorDefinicionesAdaptadas {
  if (!defs) return { campos: [] };
  // Aceptar tanto el objeto completo ({result, data}) como directamente el `data`
  const d = defs.data ? defs.data : defs;

  // ===== Contrato nuevo (SearchDefinitionsDTO) =====
  if (Array.isArray((d as SearchDefinitions)?.fields)) {
    const defsNew = d as SearchDefinitions;
    let fields = defsNew.fields.slice();

    // Filtrar si se indica
    if (opciones?.camposMostrar) {
      fields = fields.filter((f) => opciones.camposMostrar!.includes(f.key));
    }
    // Ordenar si se indica
    if (opciones?.camposOrden) {
      const ordered = opciones.camposOrden;
      fields.sort((a, b) => {
        const ia = ordered.indexOf(a.key);
        const ib = ordered.indexOf(b.key);
        if (ia === -1 && ib === -1) return a.key.localeCompare(b.key);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }

    const entityCandidates = defsNew.entity ? [defsNew.entity] : undefined;

    const camposAdaptados: BuscadorCampoDef[] = fields.map((f: SearchFieldDefinition) => {
      const opsRaw = Array.isArray(f.operations) ? f.operations : [];
      const operaciones = opsRaw
        .map((op: string) => normalizeOperation(op) || op)
        .map((op: string) => ({
          value: op,
          label: TRADUCCIONES_OPERACIONES[op] || op,
        }));

      const tipo: TipoCampoBuscador =
        mapFieldTypeToTipo(f.type) ?? obtenerTipoCampoBuscador(f.key, entityCandidates);

      return {
        key: f.key,
        label: traducirCampoPorEntidad(f.key, entityCandidates) || f.label || f.key,
        tipo,
        operaciones,
        enumValues: Array.isArray(f.enumValues) ? f.enumValues : undefined,
        rawType: f.type,
      };
    });

    return {
      campos: camposAdaptados,
      indicaciones: defsNew.hints,
      ejemplo: defsNew.example,
      entity: defsNew.entity,
      version: defsNew.version,
    };
  }

  // ===== Fallback contrato antiguo (v1) =====
  const filterKeys: string[] = d.filterKeySegunClazzNamePermitido || [];
  const opPermitido = d.operationPermitido || {};

  let campos = Array.isArray(filterKeys) ? filterKeys.slice() : [];
  if (opciones?.camposMostrar) {
    campos = campos.filter((c) => opciones.camposMostrar!.includes(c));
  }
  if (opciones?.camposOrden) {
    campos = opciones.camposOrden.concat(campos.filter((c) => !opciones.camposOrden!.includes(c)));
  }

  const camposAdaptados: BuscadorCampoDef[] = campos.map((key) => {
    const opsRaw: string[] = opPermitido[key] || [];
    const operaciones = opsRaw.map((op: string) => ({
      value: normalizeOperation(op) || op,
      label: TRADUCCIONES_OPERACIONES[op] || op,
    }));
    return {
      key,
      label: traducirCampoPorEntidad(key, d.clazzNamePermitido) || key,
      tipo: obtenerTipoCampoBuscador(key, d.clazzNamePermitido),
      operaciones,
    };
  });

  const adapted: BuscadorDefinicionesAdaptadas = {
    campos: camposAdaptados,
    indicaciones: d.indicaciones,
    ejemplo: d.ejemplo,
  };

  // Normalizar ejemplo.searchCriteriaList (si existe) para que use nombres largos
  if (adapted.ejemplo && Array.isArray(adapted.ejemplo.searchCriteriaList)) {
    adapted.ejemplo = {
      ...adapted.ejemplo,
      searchCriteriaList: adapted.ejemplo.searchCriteriaList.map((sc: any) => ({
        ...sc,
        operation: normalizeOperation(sc.operation) || sc.operation,
      })),
    };
  }

  return adapted;
}

function mapFieldTypeToTipo(t: string | null | undefined): TipoCampoBuscador | undefined {
  const type = String(t ?? '').trim().toLowerCase();
  if (!type) return undefined;
  if (type === 'string') return 'string';
  if (type === 'number' || type === 'integer' || type === 'long' || type === 'double')
    return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'date') return 'date';
  if (type === 'datetime' || type === 'localdatetime') return 'datetime';
  if (type === 'enum') return 'select';
  return undefined;
}
