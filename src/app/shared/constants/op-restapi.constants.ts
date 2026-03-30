import { VERSION } from '@angular/core';

// op-rest-api.constants.ts
export const OPRestApiConstants: any = {
  VERSION: '1.0.0',
};

export const OPRestMethods: any = {
  ENTRADAS: {
    BASE: '/entradas',
    CREAR: '/entradas/crear', // POST para crear una entrada
    OBTENER_POR_ID: (id: number) => `/entradas/obtenerPorId/${id}`, // GET para obtener una entrada por ID
    ACTUALIZAR: (id: number) => `/entradas/${id}`, // PUT para actualizar una entrada
    ELIMINAR: (id: number) => `/entradas/${id}`, // DELETE para eliminar una entrada
    OBTENER_POR_SLUG: (slug: string) => `/entradas/obtenerPorSlug/${slug}`,
    BUSCAR_DEFINICIONES: '/entradas/buscar/definicionesBuscador',
  },
  ROLES: {
    BASE: '/roles',
    CREAR: `/roles/crear`,
    OBTENER_POR_ID: (id: number) => `/roles/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/roles/${id}`,
    ELIMINAR: (id: number) => `/roles/${id}`,
    OBTENER_POR_CODIGO: (codigo: string) => `/roles/obtenerPorCodigo/${codigo}`,
    ACTUALIZAR_POR_CODIGO: (codigo: string) => `/roles/actualizarPorCodigo/${codigo}`,
    BORRAR_POR_CODIGO: (codigo: string) => `/roles/borrarPorCodigo/${codigo}`,
  },
  PRIVILEGIOS: {
    BASE: '/privilegios',
    CREAR: `/privilegios/crear`,
    OBTENER_POR_ID: (id: number) => `/privilegios/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/privilegios/${id}`,
    ELIMINAR: (id: number) => `/privilegios/${id}`,
    OBTENER_POR_CODIGO: (codigo: string) => `/privilegios/obtenerPorCodigo/${codigo}`,
    ACTUALIZAR_POR_CODIGO: (codigo: string) => `/privilegios/actualizarPorCodigo/${codigo}`,
    BORRAR_POR_CODIGO: (codigo: string) => `/privilegios/borrarPorCodigo/${codigo}`,
  },
  USUARIOS: {
    BASE: '/usuarios',
    CREAR: `/usuarios/crear`,
    OBTENER_POR_ID: (id: number) => `/usuarios/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/usuarios/${id}`,
    ELIMINAR: (id: number) => `/usuarios/${id}`,
    OBTENER_POR_USERNAME: (username: string) => `/usuarios/obtenerPorUsername/${username}`,
    ACTUALIZAR_POR_USERNAME: (username: string) => `/usuarios/actualizarPorUsername/${username}`,
    BORRAR_POR_USERNAME: (username: string) => `/usuarios/borrarPorUsername/${username}`,
    PERFIL_YO: `/usuarios/perfil/yo`,
    PERFIL_POR_USERNAME: (username: string) => `/usuarios/perfil/${username}`,
  },
  COMENTARIOS: {
    BASE: '/comentarios',
    CREAR: `/comentarios/crear`,
    OBTENER_POR_ID: (id: number) => `/comentarios/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/comentarios/${id}`,
    ELIMINAR: (id: number) => `/comentarios/${id}`,
    LISTAR_POR_ID_ENTRADA: (idEntrada: number) => `/comentarios/listarPorIdEntrada/${idEntrada}`,
    RECUENTOS_POR_ID_ENTRADA: (idEntrada: number) => `/comentarios/recuentosPorIdEntrada/${idEntrada}`,
    BUSCAR: '/comentarios/buscar',
  },
  CATEGORIAS: {
    BASE: '/categorias',
    CREAR: `/categorias/crear`,
    OBTENER_POR_ID: (id: number) => `/categorias/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/categorias/${id}`,
    ELIMINAR: (id: number) => `/categorias/${id}`,
    OBTENER_POR_CODIGO: (codigo: string) => `/categorias/obtenerPorCodigo/${codigo}`,
    ACTUALIZAR_POR_CODIGO: (codigo: string) => `/categorias/actualizarPorCodigo/${codigo}`,
    BORRAR_POR_CODIGO: (codigo: string) => `/categorias/borrarPorCodigo/${codigo}`,
    BUSCAR: '/categorias/buscar',
  },
  ETIQUETAS: {
    BASE: '/etiquetas',
    CREAR: `/etiquetas/crear`,
    OBTENER_POR_ID: (id: number) => `/etiquetas/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/etiquetas/${id}`,
    ELIMINAR: (id: number) => `/etiquetas/${id}`,
    OBTENER_POR_CODIGO: (codigo: string) => `/etiquetas/obtenerPorCodigo/${codigo}`,
    ACTUALIZAR_POR_CODIGO: (codigo: string) => `/etiquetas/actualizarPorCodigo/${codigo}`,
    BORRAR_POR_CODIGO: (codigo: string) => `/etiquetas/borrarPorCodigo/${codigo}`,
    BUSCAR: '/etiquetas/buscar',
  },
  FILE_STORAGE: {
    BASE: '/fileStorage',
    CREAR: `/fileStorage/crear`,
    OBTENER_POR_ID: (id: number) => `/fileStorage/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/fileStorage/${id}`,
    ELIMINAR: (id: number) => `/fileStorage/${id}`,
  },
  PERFILES: {
    BASE: '/perfil',
    CREAR: `/perfil/crear`,
    OBTENER_POR_ID: (id: number) => `/perfil/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/perfil/${id}`,
    ELIMINAR: (id: number) => `/perfil/${id}`,
  },
  BUSCAR: {
    BASE: '/buscar',
    DEFINICIONES: '/buscar/definicionesBuscador',
  },
  AUTH: {
    BASE: '/auth',
    LOGIN: '/login',
    REGISTER_USER: '/auth/registerUser',
    REFRESH_TOKEN: '/auth/refreshToken',
    LOGOUT: '/logout',
  },
  REDIS: {
    BASE: '/redis',
  },
  CONFIRM_REGISTER: {
    BASE: '/validaRegistro/confirmarRegistroUsuario',
  },
  HERRAMIENTAS_AUXILIAR: {
    BASE: '/herramientas/sistema',
  },
  FICHEROS: {
    RUTA_INTERNA: '/fileStorage/ficheros/obtenerDatos/',
  },
  TIPOS_ENTRADAS: {
    BASE: '/tiposEntradas',
    OBTENER_POR_ID: (id: number) => `/tiposEntradas/obtenerPorId/${id}`,
    CREAR: '/tiposEntradas/crear',
    ACTUALIZAR: (id: number) => `/tiposEntradas/${id}`,
    ELIMINAR: (id: number) => `/tiposEntradas/${id}`,
    OBTENER_POR_CODIGO: (codigo: string) => `/tiposEntradas/obtenerPorCodigo/${codigo}`,
    ACTUALIZAR_POR_CODIGO: (codigo: string) => `/tiposEntradas/actualizarPorCodigo/${codigo}`,
    BORRAR_POR_CODIGO: (codigo: string) => `/tiposEntradas/borrarPorCodigo/${codigo}`,
  },
  ESTADOS_ENTRADAS: {
    BASE: '/estadosEntradas',
    OBTENER_POR_CODIGO: (codigo: string) => `/estadosEntradas/obtenerPorCodigo/${codigo}`,
    ACTUALIZAR_POR_CODIGO: (codigo: string) => `/estadosEntradas/actualizarPorCodigo/${codigo}`,
    BORRAR_POR_CODIGO: (codigo: string) => `/estadosEntradas/borrarPorCodigo/${codigo}`,
  },
  PLANTILLA_EMAIL: {
    BASE: '/plantillaEmail',
    OBTENER_POR_CODIGO: (codigo: string) => `/plantillaEmail/obtenerPorCodigo/${codigo}`,
    ACTUALIZAR_POR_CODIGO: (codigo: string) => `/plantillaEmail/actualizarPorCodigo/${codigo}`,
    BORRAR_POR_CODIGO: (codigo: string) => `/plantillaEmail/borrarPorCodigo/${codigo}`,
    PARAMETROS: {
      BASE: '/plantillaEmail/parametros',
      LISTAR_POR_ID_PLANTILLA: (id: number) =>
        `/plantillaEmail/parametros/listarPorIdPlantilla/${id}`,
      OBTENER_POR_CLAVE: (clave: string) => `/plantillaEmail/parametros/obtenerPorClave/${clave}`,
      OBTENER_POR_VALOR: (valor: string) => `/plantillaEmail/parametros/obtenerPorValor/${valor}`,
    },
  },
  LITERALES: {
    BASE: '/literales',
    OBTENER_POR_CODIGO_LITERAL: (codigoLiteral: string) =>
      `/literales/obtenerPorCodigoLiteral/${codigoLiteral}`,
    OBTENER_POR_CODIGO_PROPIEDAD: (codigoPropiedad: string) =>
      `/literales/obtenerPorCodigoPropiedad/${codigoPropiedad}`,
  },
  AGRAVIOS: {
    BASE: '/agravios',
    OBTENER_POR_PALABRA: (palabra: string) => `/agravios/obtenerPorPalabra/${palabra}`,
  },
  EXCEPCIONES: {
    BASE: '/excepciones',
    OBTENER_POR_UUID: (uuid: string) => `/excepciones/obtenerPorUuid/${uuid}`,
  },
  SESIONES: {
    BASE: '/sesiones',
    OBTENER_POR_HASH_SESION_TOKEN: (hash: string) => `/sesiones/obtenerPorHashSesionToken/${hash}`,
  },
};
