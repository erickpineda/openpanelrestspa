import { INavData } from '@coreui/angular';
import { Observable } from 'rxjs';

/**
 * Enum de roles de usuario para control de acceso en navegación
 */
export enum UserRole {
  PROPIETARIO = 'PROPI',
  ADMINISTRADOR = 'ADMIN',
  MANTENIMIENTO = 'MANTE',
  EDITOR = 'EDITO',
  DESARROLLADOR = 'DESAR',
  AUTOR = 'AUTOR',
  LECTOR = 'LECTO',
  ANONYMOUS = 'ANONY'
}

/**
 * Configuración de badge dinámico para elementos de navegación
 */
export interface BadgeConfig {
  type: 'static' | 'dynamic';
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  text?: string;
  countService?: string;
  refreshInterval?: number;
  showZero?: boolean;
}

/**
 * Acción contextual para elementos de navegación
 */
export interface IContextualAction {
  name: string;
  icon: string;
  action: () => void;
  tooltip?: string;
}

/**
 * Configuración responsiva para elementos de navegación
 */
export interface ResponsiveConfig {
  hideOnMobile?: boolean;
  collapseThreshold?: number;
}

/**
 * Interfaz extendida para elementos de navegación con funcionalidades mejoradas
 */
export interface INavItemEnhanced extends INavData {
  priority?: number;
  requiredRoles?: UserRole[];
  minRole?: UserRole;
  dynamicBadge?: {
    service: string;
    method: string;
    refreshInterval?: number;
  };
  contextualActions?: IContextualAction[];
  responsiveConfig?: ResponsiveConfig;
  children?: INavItemEnhanced[];
}

/**
 * Configuración de análisis para elementos de navegación
 */
export interface AnalyticsConfig {
  trackClicks?: boolean;
  category?: string;
  label?: string;
}

/**
 * Elemento de navegación con configuración completa
 */
export interface NavigationItem {
  id: string;
  name: string;
  url: string;
  icon: string;
  priority?: number;
  badge?: BadgeConfig;
  children?: NavigationItem[];
  contextualActions?: IContextualAction[];
  analytics?: AnalyticsConfig;
}

/**
 * Sección de navegación con agrupación lógica
 */
export interface NavigationSection {
  id: string;
  title: string;
  icon: string;
  priority: number;
  items: NavigationItem[];
  collapsible: boolean;
  defaultExpanded: boolean;
  requiredRoles: UserRole[];
}

/**
 * Tema de navegación
 */
export interface NavigationTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  activeColor: string;
}

/**
 * Preferencias de usuario para navegación
 */
export interface UserNavigationPreferences {
  expandedSections: string[];
  collapsedSections: string[];
  favoriteItems: string[];
  customOrder?: string[];
}

/**
 * Configuración completa de navegación
 */
export interface NavigationConfig {
  sections: NavigationSection[];
  theme: NavigationTheme;
  userPreferences: UserNavigationPreferences;
}

/**
 * Interfaz del servicio de navegación
 */
export interface INavigationService {
  getNavigationItems(userRole: UserRole): Observable<INavItemEnhanced[]>;
  updateBadgeCount(itemId: string, count: number): void;
  toggleSection(sectionId: string): void;
  getActiveSection(): string;
  setContextualActions(itemId: string, actions: IContextualAction[]): void;
  filterByPermissions(items: INavItemEnhanced[], userRole: UserRole): INavItemEnhanced[];
}

/**
 * Interfaz del servicio de contadores dinámicos
 */
export interface IBadgeCounterService {
  getUnmoderatedCommentsCount(): Observable<number>;
  getDraftEntriesCount(): Observable<number>;
  getPendingUsersCount(): Observable<number>;
  getSystemAlertsCount(): Observable<number>;
  refreshAllCounters(): void;
}

/**
 * Códigos de error específicos para navegación
 */
export enum NavigationErrorCodes {
  INVALID_STRUCTURE = 'NAV_001',
  PERMISSION_DENIED = 'NAV_002',
  COUNTER_SERVICE_UNAVAILABLE = 'NAV_003',
  CONFIGURATION_INVALID = 'NAV_004',
  RESPONSIVE_ADAPTATION_FAILED = 'NAV_005'
}

/**
 * Matriz de permisos por rol - define qué funcionalidades puede acceder cada rol
 */
export interface RolePermissionMatrix {
  [key: string]: {
    [UserRole.PROPIETARIO]: boolean;
    [UserRole.ADMINISTRADOR]: boolean;
    [UserRole.MANTENIMIENTO]: boolean;
    [UserRole.EDITOR]: boolean;
    [UserRole.DESARROLLADOR]: boolean;
    [UserRole.AUTOR]: boolean;
    [UserRole.LECTOR]: boolean;
  };
}

/**
 * Configuración de permisos por defecto para diferentes funcionalidades
 */
export const DEFAULT_PERMISSION_MATRIX: RolePermissionMatrix = {
  dashboard: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: true,
    [UserRole.MANTENIMIENTO]: true,
    [UserRole.EDITOR]: true,
    [UserRole.DESARROLLADOR]: true,
    [UserRole.AUTOR]: true,
    [UserRole.LECTOR]: false
  },
  newEntry: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: true,
    [UserRole.MANTENIMIENTO]: false,
    [UserRole.EDITOR]: true,
    [UserRole.DESARROLLADOR]: true,
    [UserRole.AUTOR]: true,
    [UserRole.LECTOR]: false
  },
  manageEntries: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: true,
    [UserRole.MANTENIMIENTO]: false,
    [UserRole.EDITOR]: true,
    [UserRole.DESARROLLADOR]: true,
    [UserRole.AUTOR]: true, // Solo sus propias entradas
    [UserRole.LECTOR]: false
  },
  categories: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: true,
    [UserRole.MANTENIMIENTO]: false,
    [UserRole.EDITOR]: true,
    [UserRole.DESARROLLADOR]: true,
    [UserRole.AUTOR]: false,
    [UserRole.LECTOR]: false
  },
  tags: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: true,
    [UserRole.MANTENIMIENTO]: false,
    [UserRole.EDITOR]: true,
    [UserRole.DESARROLLADOR]: true,
    [UserRole.AUTOR]: true,
    [UserRole.LECTOR]: false
  },
  pages: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: true,
    [UserRole.MANTENIMIENTO]: false,
    [UserRole.EDITOR]: true,
    [UserRole.DESARROLLADOR]: true,
    [UserRole.AUTOR]: false,
    [UserRole.LECTOR]: false
  },
  multimedia: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: true,
    [UserRole.MANTENIMIENTO]: false,
    [UserRole.EDITOR]: true,
    [UserRole.DESARROLLADOR]: true,
    [UserRole.AUTOR]: true,
    [UserRole.LECTOR]: false
  },
  comments: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: true,
    [UserRole.MANTENIMIENTO]: false,
    [UserRole.EDITOR]: true,
    [UserRole.DESARROLLADOR]: true,
    [UserRole.AUTOR]: false,
    [UserRole.LECTOR]: false
  },
  users: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: true,
    [UserRole.MANTENIMIENTO]: false,
    [UserRole.EDITOR]: false,
    [UserRole.DESARROLLADOR]: false,
    [UserRole.AUTOR]: false,
    [UserRole.LECTOR]: false
  },
  rolesPermissions: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: false,
    [UserRole.MANTENIMIENTO]: false,
    [UserRole.EDITOR]: false,
    [UserRole.DESARROLLADOR]: false,
    [UserRole.AUTOR]: false,
    [UserRole.LECTOR]: false
  },
  configuration: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: true,
    [UserRole.MANTENIMIENTO]: false,
    [UserRole.EDITOR]: false,
    [UserRole.DESARROLLADOR]: true, // Solo herramientas de desarrollo y apariencia
    [UserRole.AUTOR]: false,
    [UserRole.LECTOR]: false
  },
  maintenance: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: false,
    [UserRole.MANTENIMIENTO]: true,
    [UserRole.EDITOR]: false,
    [UserRole.DESARROLLADOR]: true,
    [UserRole.AUTOR]: false,
    [UserRole.LECTOR]: false
  },
  profile: {
    [UserRole.PROPIETARIO]: true,
    [UserRole.ADMINISTRADOR]: true,
    [UserRole.MANTENIMIENTO]: true,
    [UserRole.EDITOR]: true,
    [UserRole.DESARROLLADOR]: true,
    [UserRole.AUTOR]: true,
    [UserRole.LECTOR]: true
  }
};