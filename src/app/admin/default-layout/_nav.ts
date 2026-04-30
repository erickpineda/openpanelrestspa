import { INavItemEnhanced, UserRole } from '../../shared/types/navigation.types';
import { OpPrivilegioConstants } from '../../shared/constants/op-privilegio.constants';

export const navItems: INavItemEnhanced[] = [
  // Dashboard Section
  {
    name: 'MENU.DASHBOARD',
    url: '/admin/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    priority: 100,
    requiredPermissions: [OpPrivilegioConstants.VER_DASHBOARD],
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
    requiredPermissions: [OpPrivilegioConstants.VER_DASHBOARD],
    attributes: { id: 'nav-control-panel' },
  },

  // Content Management Section
  {
    title: true,
    name: 'MENU.CONTENT_MANAGEMENT',
    priority: 90,
    requiredPermissions: [OpPrivilegioConstants.VER_DASHBOARD],
    attributes: { id: 'nav-title-content' },
  },
  {
    name: 'MENU.ENTRIES',
    url: '/admin/control/entradas',
    iconComponent: { name: 'cil-pencil' },
    priority: 85,
    requiredPermissions: [
      OpPrivilegioConstants.CREAR_ENTRADAS,
      OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
      OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
    ],
    permissionMode: 'ANY',
    attributes: { id: 'nav-entries' },
    children: [
      {
        name: 'MENU.ALL_ENTRIES',
        url: '/admin/control/entradas',
        iconComponent: { name: 'cil-list' },
        priority: 90,
        requiredPermissions: [
          OpPrivilegioConstants.CREAR_ENTRADAS,
          OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
          OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
        ],
        permissionMode: 'ANY',
      },
      {
        name: 'MENU.DRAFTS',
        url: '/admin/control/entradas/entradas-temporales',
        iconComponent: { name: 'cil-history' },
        priority: 80,
        requiredPermissions: [
          OpPrivilegioConstants.CREAR_ENTRADAS,
          OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
          OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
        ],
        permissionMode: 'ANY',
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
        requiredPermissions: [
          OpPrivilegioConstants.GESTIONAR_CATEGORIAS,
          OpPrivilegioConstants.GESTIONAR_ETIQUETAS,
        ],
        permissionMode: 'ANY',
        children: [
          {
            name: 'MENU.CATEGORIES',
            url: '/admin/control/categorias',
            iconComponent: { name: 'cil-spreadsheet' },
            priority: 100,
            requiredPermissions: [OpPrivilegioConstants.GESTIONAR_CATEGORIAS],
          },
          {
            name: 'MENU.TAGS',
            url: '/admin/control/etiquetas',
            iconComponent: { name: 'cil-tags' },
            priority: 90,
            requiredPermissions: [OpPrivilegioConstants.GESTIONAR_ETIQUETAS],
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
    linkProps: { fragment: 'someAnchor' },
    attributes: { id: 'nav-pages' },
    requiredRoles: [
      UserRole.EDITOR,
      UserRole.ADMINISTRADOR,
      UserRole.DESARROLLADOR,
      UserRole.PROPIETARIO,
    ],
  },
  {
    name: 'MENU.MEDIA',
    url: '/admin/control/contenido',
    iconComponent: { name: 'cil-image' },
    priority: 70,
    requiredPermissions: [OpPrivilegioConstants.GESTIONAR_ARCHIVOS],
    attributes: { id: 'nav-media' },
    children: [
      {
        name: 'MENU.IMAGES',
        url: '/admin/control/contenido/imagenes',
        iconComponent: { name: 'cil-image-plus' },
        priority: 100,
        requiredPermissions: [OpPrivilegioConstants.GESTIONAR_ARCHIVOS],
      },
      {
        name: 'MENU.FILES',
        url: '/admin/control/contenido/archivos',
        iconComponent: { name: 'cil-file' },
        priority: 90,
        requiredPermissions: [OpPrivilegioConstants.GESTIONAR_ARCHIVOS],
      },
    ],
  },
  {
    name: 'MENU.COMMENTS',
    url: '/admin/control/comentarios',
    iconComponent: { name: 'cil-comment-square' },
    priority: 65,
    requiredPermissions: [OpPrivilegioConstants.MODERAR_COMENTARIOS],
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
    requiredPermissions: [
      OpPrivilegioConstants.GESTIONAR_USUARIOS,
      OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS,
      OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS,
    ],
    permissionMode: 'ANY',
    attributes: { id: 'nav-title-users' },
  },
  {
    name: 'MENU.USERS',
    url: '/admin/control/gestion/usuarios',
    iconComponent: { name: 'cil-people' },
    priority: 55,
    requiredPermissions: [OpPrivilegioConstants.GESTIONAR_USUARIOS],
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
    requiredPermissions: [
      OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS,
      OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS,
    ],
    permissionMode: 'ANY',
    attributes: { id: 'nav-roles' },
    children: [
      {
        name: 'MENU.ROLES',
        url: '/admin/control/gestion/roles',
        iconComponent: { name: 'cil-lock-locked' },
        priority: 100,
        requiredPermissions: [OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS],
      },
      {
        name: 'MENU.PRIVILEGES',
        url: '/admin/control/gestion/privilegios',
        iconComponent: { name: 'cil-check-circle' },
        priority: 90,
        requiredPermissions: [OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS],
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
    requiredPermissions: [OpPrivilegioConstants.GESTIONAR_PERFIL],
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
    requiredPermissions: [OpPrivilegioConstants.CONFIGURAR_SISTEMA],
  },
  {
    name: 'MENU.APPEARANCE',
    url: '/admin/control/configuracion/temas',
    iconComponent: { name: 'cil-paint-bucket' },
    priority: 35,
    requiredPermissions: [OpPrivilegioConstants.CONFIGURAR_SISTEMA],
  },
  {
    name: 'MENU.GENERAL_SETTINGS',
    url: '/admin/control/configuracion/ajustes',
    iconComponent: { name: 'cil-settings' },
    priority: 30,
    requiredPermissions: [OpPrivilegioConstants.CONFIGURAR_SISTEMA],
  },
  {
    name: 'MENU.ADVANCED_SETTINGS',
    url: '/admin/control/configuracion',
    iconComponent: { name: 'cil-equalizer' },
    priority: 25,
    requiredPermissions: [OpPrivilegioConstants.CONFIGURAR_SISTEMA],
  },

  // Maintenance Section (for specific roles only)
  {
    title: true,
    name: 'MENU.MAINTENANCE',
    priority: 5,
    requiredPermissions: [
      OpPrivilegioConstants.REALIZAR_MANTENIMIENTO,
      OpPrivilegioConstants.DEPURAR_ERRORES,
    ],
    permissionMode: 'ANY',
  },
  {
    name: 'MENU.SYSTEM_LOGS',
    url: '/admin/control/mantenimiento/logs',
    iconComponent: { name: 'cil-search' },
    priority: 4,
    requiredPermissions: [
      OpPrivilegioConstants.REALIZAR_MANTENIMIENTO,
      OpPrivilegioConstants.DEPURAR_ERRORES,
    ],
    permissionMode: 'ANY',
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
    requiredPermissions: [OpPrivilegioConstants.REALIZAR_MANTENIMIENTO],
  },
  {
    name: 'MENU.DEV_TOOLS',
    url: '/admin/control/mantenimiento/dev-tools',
    iconComponent: { name: 'cil-code' },
    priority: 2,
    requiredPermissions: [OpPrivilegioConstants.DEPURAR_ERRORES],
  },

  // Quick Links Section
  {
    title: true,
    name: 'MENU.QUICK_LINKS',
    priority: 1,
  },
  {
    name: 'MENU.VIEW_WEBSITE',
    url: '/',
    iconComponent: { name: 'cil-external-link' },
    priority: 1,
    attributes: { target: '_blank' },
  },
];
