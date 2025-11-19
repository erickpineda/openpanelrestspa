// Mapeo de tipos de campo para el BuscadorAvanzadoComponent
// Extensible por entidad y campo. Usar 'string', 'number', 'date', 'boolean', 'select', etc.

export type TipoCampoBuscador = 'string' | 'number' | 'date' | 'boolean' | 'select';

export interface MapeoTiposCampos {
  [entidad: string]: {
    [campo: string]: TipoCampoBuscador;
  };
}

export const TIPOS_CAMPOS_POR_ENTIDAD: MapeoTiposCampos = {
  Entrada: {
    'titulo': 'string',
    'contenido': 'string',
    'resumen': 'string',
    'notas': 'string',
    'slug': 'string',
    'subtitulo': 'string',
    'idEntrada': 'number',
    'idUsuario': 'number',
    'idUsuarioEditado': 'number',
    'votos': 'number',
    'cantidadComentarios': 'number',
    'fechaEdicion': 'date',
    'fechaPublicacion': 'date',
    'fechaPublicacionProgramada': 'date',
    'auditFechaCreacion': 'date',
    'auditFechaModif': 'date',
    'auditFechaCancel': 'date',
    'borrador': 'boolean',
    'publicada': 'boolean',
    'privado': 'boolean',
    'permitirComentario': 'boolean',
    'estadoEntrada.nombre': 'select',
    'tipoEntrada.nombre': 'select',
    'categoria.nombre': 'select',
    'etiqueta.nombre': 'select',
    'usuario.username': 'string',
    'usuario.nombre': 'string',
    'usernameCreador': 'string',
    'usernameModificador': 'string',
    'auditUsuCreacion': 'string',
    'auditUsuModif': 'string',
    'auditUsuCancel': 'string',
  }
  // Otras entidades aquí...
};

/**
 * Devuelve el tipo de campo para una clave y lista de entidades candidatas.
 * Si no se encuentra, retorna 'string' por defecto.
 */
export function obtenerTipoCampoBuscador(key: string, clazzCandidates?: string[] | null): TipoCampoBuscador {
  if (!key) return 'string';
  if (Array.isArray(clazzCandidates)) {
    for (const clazz of clazzCandidates) {
      const map = TIPOS_CAMPOS_POR_ENTIDAD[clazz];
      if (map && map[key]) return map[key];
    }
  }
  // Fallback: buscar en todas las entidades
  for (const clazz in TIPOS_CAMPOS_POR_ENTIDAD) {
    if (TIPOS_CAMPOS_POR_ENTIDAD[clazz][key]) return TIPOS_CAMPOS_POR_ENTIDAD[clazz][key];
  }
  return 'string';
}
