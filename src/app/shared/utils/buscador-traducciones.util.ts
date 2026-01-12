// Traducciones de campos por entidad para el BuscadorAvanzado
// Añadir nuevas entidades aquí según se necesite.

export const TRADUCCIONES_POR_ENTIDAD: Record<string, Record<string, string>> = {
  Entrada: {
    titulo: 'Título',
    auditFechaCancel: 'Fecha de cancelación',
    auditFechaCreacion: 'Fecha de creación',
    auditFechaModif: 'Fecha de modificación',
    auditUsuCancel: 'Usuario cancelador',
    auditUsuCreacion: 'Usuario creador',
    auditUsuModif: 'Usuario modificador',
    borrador: '¿Borrador?',
    cantidadComentarios: 'Cantidad de comentarios',
    'categoria.nombre': 'Categoría',
    contenido: 'Contenido',
    'estadoEntrada.nombre': 'Estado',
    'etiqueta.nombre': 'Etiqueta',
    fechaEdicion: 'Fecha de edición',
    fechaPublicacion: 'Fecha de publicación',
    fechaPublicacionProgramada: 'Fecha publicación programada',
    idEntrada: 'ID Entrada',
    idUsuario: 'ID Usuario',
    idUsuarioEditado: 'ID Usuario Editado',
    notas: 'Notas',
    permitirComentario: '¿Permitir comentario?',
    privado: '¿Privado?',
    publicada: '¿Publicada?',
    resumen: 'Resumen',
    slug: 'Slug',
    subtitulo: 'Subtítulo',
    'tipoEntrada.nombre': 'Tipo de entrada',
    usernameCreador: 'Usuario creador',
    usernameModificador: 'Usuario modificador',
    'usuario.nombre': 'Nombre de usuario',
    'usuario.username': 'Usuario',
    votos: 'Votos',
  },
};

/**
 * Traduce la clave `key` buscando en las entidades provistas en `clazzCandidates`.
 * Si no se encuentra traducción, devuelve la clave original.
 */
export function traducirCampoPorEntidad(key: string, clazzCandidates?: string[] | null): string {
  if (!key) return key;
  if (Array.isArray(clazzCandidates)) {
    for (const clazz of clazzCandidates) {
      const map = TRADUCCIONES_POR_ENTIDAD[clazz];
      if (map && map[key]) return map[key];
    }
  }
  // Fallback: intentar buscar en todas las entidades
  for (const clazz in TRADUCCIONES_POR_ENTIDAD) {
    if (TRADUCCIONES_POR_ENTIDAD[clazz][key]) return TRADUCCIONES_POR_ENTIDAD[clazz][key];
  }
  return key;
}
