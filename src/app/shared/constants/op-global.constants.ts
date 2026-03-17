import { OPRestApiConstants, OPRestMethods } from './op-restapi.constants';
import { OPSessionConstants } from './op-session.constants';
import { OPStorageConstants } from './op-storage.constants';
import { OPEventsConstants } from './op-events.constants';
import { OPSyncConstants } from './op-sync.constants';
import { OPPaginationConstants } from './op-pagination.constants';
import { OPRolesConstants } from './op-roles.constants';
import { OPAppConstants } from './op-app.constants';

/**
 * OPConstants
 *
 * Agrupador global de constantes de la aplicación.
 * Las constantes específicas se han extraído a archivos separados (op-*.constants.ts)
 * para mejorar la mantenibilidad y modularidad.
 */
export const OPConstants = {
  API: OPRestApiConstants,
  Methods: OPRestMethods,
  Session: OPSessionConstants,
  Storage: OPStorageConstants,
  Events: OPEventsConstants,
  Sync: OPSyncConstants,
  Pagination: OPPaginationConstants,
  Roles: OPRolesConstants,
  App: OPAppConstants,
} as const;
