/**
 * Constantes de privilegios (deben coincidir con Privilegio.nombre en backend).
 *
 * Nota: se usan para navegación/guards. La autorización real siempre la decide el backend.
 */
export const OpPrivilegioConstants = {
  // Acceso base
  ACCESO_PANEL: 'ACCESO_PANEL',

  // Visualización
  VER_CONTENIDO_PUBLICO: 'VER_CONTENIDO_PUBLICO',
  VER_CONTENIDO_PROPIO: 'VER_CONTENIDO_PROPIO',
  // Legacy/deprecated: mantener solo como fallback temporal de compatibilidad.
  // No reutilizar en nuevas rutas, guards o navegación ya migrados.
  VER_CONTENIDO_RESTRINGIDO: 'VER_CONTENIDO_RESTRINGIDO',
  VER_DASHBOARD: 'VER_DASHBOARD',

  // Entradas
  CREAR_ENTRADAS: 'CREAR_ENTRADAS',
  EDITAR_ENTRADAS_PROPIAS: 'EDITAR_ENTRADAS_PROPIAS',
  EDITAR_ENTRADAS_TODO: 'EDITAR_ENTRADAS_TODO',
  PUBLICAR_ENTRADAS: 'PUBLICAR_ENTRADAS',
  BORRAR_ENTRADAS: 'BORRAR_ENTRADAS',

  // Comentarios
  // Legacy/deprecated: reemplazado por privilegios modulares de comentarios.
  COMENTAR: 'COMENTAR',
  VER_COMENTARIOS_PUBLICOS: 'VER_COMENTARIOS_PUBLICOS',
  VER_COMENTARIOS_CUARENTENA: 'VER_COMENTARIOS_CUARENTENA',
  CREAR_COMENTARIOS: 'CREAR_COMENTARIOS',
  EDITAR_COMENTARIOS_PROPIOS: 'EDITAR_COMENTARIOS_PROPIOS',
  BORRAR_COMENTARIOS_PROPIOS: 'BORRAR_COMENTARIOS_PROPIOS',
  APROBAR_COMENTARIOS: 'APROBAR_COMENTARIOS',
  OCULTAR_COMENTARIOS: 'OCULTAR_COMENTARIOS',
  BORRAR_COMENTARIOS: 'BORRAR_COMENTARIOS',
  BORRAR_COMENTARIOS_TODO: 'BORRAR_COMENTARIOS_TODO',
  MODERAR_COMENTARIOS: 'MODERAR_COMENTARIOS',

  // Gestión
  GESTIONAR_USUARIOS: 'GESTIONAR_USUARIOS',
  GESTIONAR_ROLES: 'GESTIONAR_ROLES',
  // Legacy/deprecated: reemplazado por GESTIONAR_ROLES.
  GESTIONAR_ROLES_USUARIOS: 'GESTIONAR_ROLES_USUARIOS',
  GESTIONAR_PRIVILEGIOS: 'GESTIONAR_PRIVILEGIOS',
  // Legacy/deprecated: reemplazado por GESTIONAR_PERFIL_PROPIO para self-service.
  GESTIONAR_PERFIL: 'GESTIONAR_PERFIL',
  GESTIONAR_PERFIL_PROPIO: 'GESTIONAR_PERFIL_PROPIO',
  GESTIONAR_INTERACCIONES_PROPIAS: 'GESTIONAR_INTERACCIONES_PROPIAS',
  GESTIONAR_ARCHIVOS: 'GESTIONAR_ARCHIVOS',
  GESTIONAR_ETIQUETAS: 'GESTIONAR_ETIQUETAS',
  GESTIONAR_CATEGORIAS: 'GESTIONAR_CATEGORIAS',
  GESTIONAR_PAGINAS: 'GESTIONAR_PAGINAS',

  // Config/Mantenimiento
  // Legacy/deprecated: reemplazado por privilegios modulares de sistema/temas.
  CONFIGURAR_SISTEMA: 'CONFIGURAR_SISTEMA',
  GESTIONAR_AJUSTES_SISTEMA: 'GESTIONAR_AJUSTES_SISTEMA',
  GESTIONAR_TEMAS: 'GESTIONAR_TEMAS',
  REALIZAR_MANTENIMIENTO: 'REALIZAR_MANTENIMIENTO',
  DEPURAR_ERRORES: 'DEPURAR_ERRORES',
  GESTIONAR_APIS: 'GESTIONAR_APIS',
} as const;

/**
 * Privilegios legacy oficialmente deprecados.
 *
 * Política:
 * - pueden seguir apareciendo como compatibilidad OR temporal donde el enforcement legado aún lo necesite;
 * - no deben reintroducirse en controladores/rutas ya migrados al catálogo modular final.
 */
export const OpPrivilegioDeprecatedLegacy = [
  OpPrivilegioConstants.VER_CONTENIDO_RESTRINGIDO,
  OpPrivilegioConstants.CONFIGURAR_SISTEMA,
  OpPrivilegioConstants.COMENTAR,
  OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS,
  OpPrivilegioConstants.GESTIONAR_PERFIL,
] as const;
