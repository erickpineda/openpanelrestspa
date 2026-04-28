import { INavItemEnhanced, UserRole } from '../../shared/types/navigation.types';

export const navItems: INavItemEnhanced[] = [
  // Dashboard Section
  {
    name: 'MENU.DASHBOARD',
    url: '/admin/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    priority: 100,
    requiredRoles: [
      UserRole.AUTOR,
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.MANTENIMIENTO,
      UserRole.PROPIETARIO,
    ],
    badge: {
      color: 'info',
      text: '+',
    },
    attributes: { id: 'nav-dashboard' },
  },

  {
    name: 'MENU.CONTROL_PANEL',
    url: '/admin/control',
    iconComponent: { name: 'cil-grid' },
    priority: 95,
    requiredRoles: [
      UserRole.AUTOR,
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.MANTENIMIENTO,
      UserRole.PROPIETARIO,
    ],
    attributes: { id: 'nav-control-panel' },
  },

  // Content Management Section
  {
    title: true,
    name: 'MENU.CONTENT_MANAGEMENT',
    priority: 90,
    requiredRoles: [
      UserRole.AUTOR,
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.PROPIETARIO,
    ],
    attributes: { id: 'nav-title-content' },
  },
  {
    name: 'MENU.ENTRIES',
    url: '/admin/control/entradas',
    iconComponent: { name: 'cil-pencil' },
    priority: 85,
    requiredRoles: [
      UserRole.AUTOR,
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.PROPIETARIO,
    ],
    attributes: { id: 'nav-entries' },
    children: [
      {
        name: 'MENU.ALL_ENTRIES',
        url: '/admin/control/entradas',
        iconComponent: { name: 'cil-list' },
        priority: 90,
        requiredRoles: [
          UserRole.AUTOR,
          UserRole.EDITOR,
          UserRole.ADMINISTRADOR,
          UserRole.DESARROLLADOR,
          UserRole.PROPIETARIO,
        ],
      },
      {
        name: 'MENU.DRAFTS',
        url: '/admin/control/entradas/entradas-temporales',
        iconComponent: { name: 'cil-history' },
        priority: 80,
        requiredRoles: [
          UserRole.AUTOR,
          UserRole.EDITOR,
          UserRole.ADMINISTRADOR,
          UserRole.DESARROLLADOR,
          UserRole.PROPIETARIO,
        ],
        dynamicBadge: {
          service: 'BadgeCounterService',
          method: 'getDraftEntriesCount',
          refreshInterval: 30000,
        },
      },
      {
        name: 'MENU.TAXONOMY',
        url: '/admin/control/taxonomia',
        iconComponent: { name: 'cil-asterisk' },
        priority: 70,
        requiredRoles: [
          UserRole.EDITOR,
          UserRole.ADMINISTRADOR,
          UserRole.DESARROLLADOR,
          UserRole.PROPIETARIO,
        ],
        children: [
          {
            name: 'MENU.CATEGORIES',
            url: '/admin/control/categorias',
            iconComponent: { name: 'cil-spreadsheet' },
            priority: 100,
            requiredRoles: [
              UserRole.EDITOR,
              UserRole.ADMINISTRADOR,
              UserRole.DESARROLLADOR,
              UserRole.PROPIETARIO,
            ],
          },
          {
            name: 'MENU.TAGS',
            url: '/admin/control/etiquetas',
            iconComponent: { name: 'cil-tags' },
            priority: 90,
            requiredRoles: [
              UserRole.AUTOR,
              UserRole.EDITOR,
              UserRole.ADMINISTRADOR,
              UserRole.DESARROLLADOR,
              UserRole.PROPIETARIO,
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'MENU.PAGES',
    url: '/admin/control/paginas',
    iconComponent: { name: 'cil-library' },
    priority: 75,
    requiredRoles: [
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.PROPIETARIO,
    ],
    linkProps: { fragment: 'someAnchor' },
    attributes: { id: 'nav-pages' },
  },
  {
    name: 'MENU.MEDIA',
    url: '/admin/control/contenido',
    iconComponent: { name: 'cil-image' },
    priority: 70,
    requiredRoles: [
      UserRole.AUTOR,
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.PROPIETARIO,
    ],
    attributes: { id: 'nav-media' },
    children: [
      {
        name: 'MENU.IMAGES',
        url: '/admin/control/contenido/imagenes',
        iconComponent: { name: 'cil-image-plus' },
        priority: 100,
        requiredRoles: [
          UserRole.AUTOR,
          UserRole.EDITOR,
          UserRole.ADMINISTRADOR,
          UserRole.DESARROLLADOR,
          UserRole.PROPIETARIO,
        ],
      },
      {
        name: 'MENU.FILES',
        url: '/admin/control/contenido/archivos',
        iconComponent: { name: 'cil-file' },
        priority: 90,
        requiredRoles: [
          UserRole.AUTOR,
          UserRole.EDITOR,
          UserRole.ADMINISTRADOR,
          UserRole.DESARROLLADOR,
          UserRole.PROPIETARIO,
        ],
      },
    ],
  },
  {
    name: 'MENU.COMMENTS',
    url: '/admin/control/comentarios',
    iconComponent: { name: 'cil-comment-square' },
    priority: 65,
    requiredRoles: [
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.PROPIETARIO,
    ],
    linkProps: { fragment: 'listadoComentarios' },
    dynamicBadge: {
      service: 'BadgeCounterService',
      method: 'getUnmoderatedCommentsCount',
      refreshInterval: 15000,
    },
    attributes: { id: 'nav-comments' },
  },

  // User Administration Section
  {
    title: true,
    name: 'MENU.USER_ADMINISTRATION',
    priority: 60,
    requiredRoles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO],
    attributes: { id: 'nav-title-users' },
  },
  {
    name: 'MENU.USERS',
    url: '/admin/control/gestion/usuarios',
    iconComponent: { name: 'cil-people' },
    priority: 55,
    requiredRoles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO],
    dynamicBadge: {
      service: 'BadgeCounterService',
      method: 'getPendingUsersCount',
      refreshInterval: 60000,
    },
    attributes: { id: 'nav-users' },
  },
  {
    name: 'MENU.ROLES_AND_PERMISSIONS',
    url: '/admin/control/gestion/roles',
    iconComponent: { name: 'cil-shield-alt' },
    priority: 50,
    requiredRoles: [UserRole.PROPIETARIO],
    attributes: { id: 'nav-roles' },
    children: [
      {
        name: 'MENU.ROLES',
        url: '/admin/control/gestion/roles',
        iconComponent: { name: 'cil-lock-locked' },
        priority: 100,
        requiredRoles: [UserRole.PROPIETARIO],
      },
      {
        name: 'MENU.PRIVILEGES',
        url: '/admin/control/gestion/privilegios',
        iconComponent: { name: 'cil-check-circle' },
        priority: 90,
        requiredRoles: [UserRole.PROPIETARIO],
      },
    ],
  },

  // User Account Section
  {
    title: true,
    name: 'MENU.MY_ACCOUNT',
    priority: 20,
  },
  {
    name: 'MENU.MY_PROFILE',
    url: '/admin/control/perfil',
    iconComponent: { name: 'cil-user' },
    priority: 15,
    requiredRoles: [
      UserRole.LECTOR,
      UserRole.AUTOR,
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.MANTENIMIENTO,
      UserRole.PROPIETARIO,
    ],
    dynamicBadge: {
      service: 'BadgeCounterService',
      method: 'getMyDraftsCount',
      refreshInterval: 60000,
    },
    attributes: { id: 'nav-profile' },
    contextualActions: [
      {
        name: 'Editar Perfil',
        icon: 'cil-pencil',
        action: () => {},
        tooltip: 'Editar información del perfil',
      },
    ],
  },

  // System Configuration Section
  {
    title: true,
    name: 'MENU.SYSTEM_CONFIGURATION',
    priority: 40,
    requiredRoles: [UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
  },
  {
    name: 'MENU.APPEARANCE',
    url: '/admin/control/configuracion/temas',
    iconComponent: { name: 'cil-paint-bucket' },
    priority: 35,
    requiredRoles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
  },
  {
    name: 'MENU.GENERAL_SETTINGS',
    url: '/admin/control/configuracion/ajustes',
    iconComponent: { name: 'cil-settings' },
    priority: 30,
    requiredRoles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO],
  },
  {
    name: 'MENU.ADVANCED_SETTINGS',
    url: '/admin/control/configuracion',
    iconComponent: { name: 'cil-equalizer' },
    priority: 25,
    requiredRoles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
  },

  // Maintenance Section (for specific roles only)
  {
    title: true,
    name: 'MENU.MAINTENANCE',
    priority: 5,
    requiredRoles: [UserRole.MANTENIMIENTO, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
  },
  {
    name: 'MENU.SYSTEM_LOGS',
    url: '/admin/control/mantenimiento/logs',
    iconComponent: { name: 'cil-search' },
    priority: 4,
    requiredRoles: [UserRole.MANTENIMIENTO, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
    dynamicBadge: {
      service: 'BadgeCounterService',
      method: 'getSystemAlertsCount',
      refreshInterval: 120000,
    },
    badge: {
      color: 'warning',
      text: '*',
    },
  },
  {
    name: 'MENU.DATABASE',
    url: '/admin/control/mantenimiento/database',
    iconComponent: { name: 'cil-storage' },
    priority: 3,
    requiredRoles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
  },
  {
    name: 'MENU.DEV_TOOLS',
    url: '/admin/control/mantenimiento/dev-tools',
    iconComponent: { name: 'cil-code' },
    priority: 2,
    requiredRoles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
  },

  // Quick Links Section
  {
    title: true,
    name: 'MENU.QUICK_LINKS',
    priority: 1,
    requiredRoles: [
      UserRole.LECTOR,
      UserRole.AUTOR,
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.MANTENIMIENTO,
      UserRole.PROPIETARIO,
    ],
  },
  {
    name: 'MENU.VIEW_WEBSITE',
    url: '/',
    iconComponent: { name: 'cil-external-link' },
    priority: 1,
    requiredRoles: [
      UserRole.LECTOR,
      UserRole.AUTOR,
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.MANTENIMIENTO,
      UserRole.PROPIETARIO,
    ],
    attributes: { target: '_blank' },
  },
];
