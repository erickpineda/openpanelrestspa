import { UserRole, NavigationTheme, BadgeConfig } from '../types/navigation.types';

/**
 * Constantes para configuración de navegación
 */
export const NavigationConstants = {
  /**
   * Configuración de badges por defecto
   */
  DEFAULT_BADGES: {
    SUCCESS: {
      type: 'static' as const,
      color: 'success' as const,
      text: '+',
    },
    WARNING: {
      type: 'static' as const,
      color: 'warning' as const,
      text: '!',
    },
    INFO: {
      type: 'static' as const,
      color: 'info' as const,
      text: 'Nuevo',
    },
    DYNAMIC_COMMENTS: {
      type: 'dynamic' as const,
      color: 'warning' as const,
      countService: 'BadgeCounterService',
      refreshInterval: 30000,
      showZero: false,
    },
    DYNAMIC_DRAFTS: {
      type: 'dynamic' as const,
      color: 'warning' as const,
      countService: 'BadgeCounterService',
      refreshInterval: 60000,
      showZero: false,
    },
  } as const,

  /**
   * Prioridades por defecto para diferentes tipos de elementos
   */
  DEFAULT_PRIORITIES: {
    DASHBOARD: 100,
    NEW_ENTRY: 90,
    CONTENT_MANAGEMENT: 80,
    USER_MANAGEMENT: 70,
    CONFIGURATION: 60,
    MAINTENANCE: 50,
    PROFILE: 40,
    EXTERNAL_LINKS: 30,
  } as const,

  /**
   * Iconos por defecto para diferentes secciones
   */
  DEFAULT_ICONS: {
    DASHBOARD: 'cil-speedometer',
    ENTRIES: 'cil-pencil',
    PAGES: 'cil-library',
    MULTIMEDIA: 'cil-image',
    COMMENTS: 'cil-comment-square',
    USERS: 'cil-people',
    ROLES: 'cil-shield-alt',
    CONFIGURATION: 'cil-settings',
    PROFILE: 'cil-user',
    MAINTENANCE: 'cil-wrench',
    EXTERNAL_LINK: 'cil-external-link',
    CATEGORIES: 'cil-spreadsheet',
    TAGS: 'cil-tags',
    FILES: 'cil-file',
    IMAGES: 'cil-image-plus',
    LOGS: 'cil-list-rich',
    DATABASE: 'cil-data-transfer-down',
    DEVELOPMENT: 'cil-code',
    THEMES: 'cil-paint-bucket',
    SETTINGS: 'cil-equalizer',
    LOCK: 'cil-lock-locked',
    PLUS: 'cil-plus',
    LIST: 'cil-list',
    HISTORY: 'cil-history',
  } as const,

  /**
   * Tema por defecto para navegación
   */
  DEFAULT_THEME: {
    primaryColor: '#321fdb',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    textColor: '#495057',
    activeColor: '#321fdb',
  } as NavigationTheme,

  /**
   * Configuración responsiva por defecto
   */
  RESPONSIVE_BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 992,
    DESKTOP: 1200,
  } as const,

  /**
   * Intervalos de actualización para badges dinámicos (en milisegundos)
   */
  REFRESH_INTERVALS: {
    FAST: 15000, // 15 segundos
    NORMAL: 30000, // 30 segundos
    SLOW: 60000, // 1 minuto
    VERY_SLOW: 300000, // 5 minutos
    TOO_SLOW: 3600000, // 1 hora
  } as const,

  /**
   * Límites de estructura de navegación
   */
  STRUCTURE_LIMITS: {
    MAX_DEPTH: 2,
    MAX_ITEMS_PER_SECTION: 20,
    MAX_SECTIONS: 10,
  } as const,

  /**
   * Roles con acceso completo (bypass de restricciones)
   */
  ADMIN_ROLES: [UserRole.PROPIETARIO, UserRole.ADMINISTRADOR] as const,

  /**
   * Roles con acceso de solo lectura
   */
  READONLY_ROLES: [UserRole.LECTOR] as const,

  /**
   * Configuración de animaciones
   */
  ANIMATIONS: {
    TRANSITION_DURATION: 300,
    FADE_DURATION: 200,
    SLIDE_DURATION: 250,
  } as const,

  /**
   * Clases CSS para diferentes estados
   */
  CSS_CLASSES: {
    ACTIVE: 'nav-item-active',
    EXPANDED: 'nav-section-expanded',
    COLLAPSED: 'nav-section-collapsed',
    DISABLED: 'nav-item-disabled',
    LOADING: 'nav-badge-loading',
    ERROR: 'nav-badge-error',
  } as const,

  /**
   * Mensajes de error localizados
   */
  ERROR_MESSAGES: {
    INVALID_STRUCTURE: 'La estructura de navegación no es válida',
    PERMISSION_DENIED: 'No tiene permisos para acceder a esta sección',
    COUNTER_SERVICE_UNAVAILABLE: 'El servicio de contadores no está disponible',
    CONFIGURATION_INVALID: 'La configuración de navegación es inválida',
    RESPONSIVE_ADAPTATION_FAILED: 'Error al adaptar la navegación para este dispositivo',
  } as const,

  /**
   * Configuración de logging
   */
  LOGGING: {
    ENABLED: true,
    LEVEL: 'warn' as const,
    PREFIX: '[Navigation]',
  } as const,
};

/**
 * Configuración específica para diferentes tipos de badges dinámicos
 */
export const DynamicBadgeConfigs = {
  UNMODERATED_COMMENTS: {
    service: 'BadgeCounterService',
    method: 'getUnmoderatedCommentsCount',
    refreshInterval: NavigationConstants.REFRESH_INTERVALS.NORMAL,
    color: 'warning' as const,
  },
  DRAFT_ENTRIES: {
    service: 'BadgeCounterService',
    method: 'getDraftEntriesCount',
    refreshInterval: NavigationConstants.REFRESH_INTERVALS.SLOW,
    color: 'warning' as const,
  },
  PENDING_USERS: {
    service: 'BadgeCounterService',
    method: 'getPendingUsersCount',
    refreshInterval: NavigationConstants.REFRESH_INTERVALS.SLOW,
    color: 'info' as const,
  },
  SYSTEM_ALERTS: {
    service: 'BadgeCounterService',
    method: 'getSystemAlertsCount',
    refreshInterval: NavigationConstants.REFRESH_INTERVALS.FAST,
    color: 'danger' as const,
  },
} as const;
