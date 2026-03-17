/**
 * OPAppConstants
 *
 * Constantes de configuración general de la aplicación,
 * agrupadas por módulos o contextos comunes (Admin, Common, etc.).
 */
export const OPAppConstants = {
  Admin: {
    Entradas: {
      ROUTE: '/admin/control/entradas',
      BOUNDARY_ID: 'listado-entradas-main',
      PAGE_SIZE: 20,
      SERVER_PAGING: true,
      DEFAULT_DATA_OPTION: 'AND',
    },
  },
  Common: {
    Pagination: {
      DROPDOWN_PAGE_SIZE: 50,
    },
    Sort: {
      ASC: 'ASC',
      DESC: 'DESC',
    },
    Estado: {
      PUBLICADA: 'PUBLICADA',
      NO_PUBLICADA: 'NO PUBLICADA',
      GUARDADA: 'GUARDADA',
      BORRADOR: 'BORRADOR',
      PENDIENTE_REVISION: 'PENDIENTE REVISION',
      EN_REVISION: 'EN REVISION',
      REVISADA: 'REVISADA',
      HISTORICA: 'HISTORICA',
      PROGRAMADA: 'PROGRAMADA',
    },
  },
};
