// Utilidad para adaptar y traducir definiciones del backend para el BuscadorAvanzadoComponent
// Puedes extender los diccionarios para más campos/operaciones

const TRADUCCIONES_CAMPOS: Record<string, string> = {
  'titulo': 'Título',
  'auditFechaCancel': 'Fecha de cancelación',
  'auditFechaCreacion': 'Fecha de creación',
  'auditFechaModif': 'Fecha de modificación',
  'auditUsuCancel': 'Usuario cancelador',
  'auditUsuCreacion': 'Usuario creador',
  'auditUsuModif': 'Usuario modificador',
  'borrador': '¿Borrador?',
  'cantidadComentarios': 'Cantidad de comentarios',
  'categoria.nombre': 'Categoría',
  'contenido': 'Contenido',
  'estadoEntrada.nombre': 'Estado',
  'etiqueta.nombre': 'Etiqueta',
  'fechaEdicion': 'Fecha de edición',
  'fechaPublicacion': 'Fecha de publicación',
  'fechaPublicacionProgramada': 'Fecha publicación programada',
  'idEntrada': 'ID Entrada',
  'idUsuario': 'ID Usuario',
  'idUsuarioEditado': 'ID Usuario Editado',
  'notas': 'Notas',
  'permitirComentario': '¿Permitir comentario?',
  'privado': '¿Privado?',
  'publicada': '¿Publicada?',
  'resumen': 'Resumen',
  'slug': 'Slug',
  'subtitulo': 'Subtítulo',
  'tipoEntrada.nombre': 'Tipo de entrada',
  'usernameCreador': 'Usuario creador',
  'usernameModificador': 'Usuario modificador',
  'usuario.nombre': 'Nombre de usuario',
  'usuario.username': 'Usuario',
  'votos': 'Votos',
};

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

export interface BuscadorCampoDef {
  key: string;
  label: string;
  operaciones: { value: string; label: string }[];
}

export interface BuscadorDefinicionesAdaptadas {
  campos: BuscadorCampoDef[];
  // Puedes añadir más si necesitas (dataOption, etc)
}

export function getBuscadorDefinicionesAmigables(defs: any, opciones?: {
  camposMostrar?: string[]; // Si quieres limitar los campos
  camposOrden?: string[];   // Si quieres forzar un orden
}): BuscadorDefinicionesAdaptadas {
  if (!defs) return { campos: [] };
  let campos = defs.filterKeySegunClazzNamePermitido as string[];
  // Filtrar si se indica
  if (opciones?.camposMostrar) {
    campos = campos.filter(c => opciones.camposMostrar!.includes(c));
  }
  // Ordenar si se indica
  if (opciones?.camposOrden) {
    campos = opciones.camposOrden.concat(campos.filter(c => !opciones.camposOrden!.includes(c)));
  }
  // Mapear a estructura amigable
  const camposAdaptados: BuscadorCampoDef[] = campos.map(key => ({
    key,
    label: TRADUCCIONES_CAMPOS[key] || key,
    operaciones: (defs.operationPermitido[key] || []).map((op: string) => ({
      value: op,
      label: TRADUCCIONES_OPERACIONES[op] || op
    }))
  }));
  return { campos: camposAdaptados };
}
