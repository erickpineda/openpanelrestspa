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
  },
  ROLES: {
    BASE: '/roles',
    CREAR: `/roles/crear`,
    OBTENER_POR_ID: (id: number) => `/roles/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/roles/${id}`,
    ELIMINAR: (id: number) => `/roles/${id}`,
  },
  PRIVILEGIOS: {
    BASE: '/privilegios',
    CREAR: `/privilegios/crear`,
    OBTENER_POR_ID: (id: number) => `/privilegios/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/privilegios/${id}`,
    ELIMINAR: (id: number) => `/privilegios/${id}`,
  },
  USUARIOS: {
    BASE: '/usuarios',
    CREAR: `/usuarios/crear`,
    OBTENER_POR_ID: (id: number) => `/usuarios/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/usuarios/${id}`,
    ELIMINAR: (id: number) => `/usuarios/${id}`,
  },
  COMENTARIOS: {
    BASE: '/comentarios',
    CREAR: `/comentarios/crear`,
    OBTENER_POR_ID: (id: number) => `/comentarios/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/comentarios/${id}`,
    ELIMINAR: (id: number) => `/comentarios/${id}`,
  },
  CATEGORIAS: {
    BASE: '/categorias',
    CREAR: `/categorias/crear`,
    OBTENER_POR_ID: (id: number) => `/categorias/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/categorias/${id}`,
    ELIMINAR: (id: number) => `/categorias/${id}`,
  },
  ETIQUETAS: {
    BASE: '/etiquetas',
    CREAR: `/etiquetas/crear`,
    OBTENER_POR_ID: (id: number) => `/etiquetas/obtenerPorId/${id}`,
    ACTUALIZAR: (id: number) => `/etiquetas/${id}`,
    ELIMINAR: (id: number) => `/etiquetas/${id}`,
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
};
