import { INavItemEnhanced, UserRole } from '../../shared/types/navigation.types';

export const navItems: INavItemEnhanced[] = [
  // Dashboard Section
  {
    name: 'Escritorio',
    url: '/admin/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    priority: 100,
    requiredRoles: [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.MANTENIMIENTO, UserRole.PROPIETARIO],
    badge: {
      color: 'info',
      text: '+'
    },
    attributes: { id: 'nav-dashboard' }
  },

  // Content Management Section
  {
    title: true,
    name: 'Gestión de Contenido',
    priority: 90,
    attributes: { id: 'nav-title-content' }
  },
  {
    name: 'Entradas',
    url: '/admin/control/entradas',
    iconComponent: { name: 'cil-pencil' },
    priority: 85,
    requiredRoles: [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
    attributes: { id: 'nav-entries' },
    children: [
      {
        name: 'Todas las Entradas',
        url: '/admin/control/entradas',
        iconComponent: { name: 'cil-list' },
        priority: 90,
        requiredRoles: [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO]
      },
      {
        name: 'Borradores',
        url: '/admin/control/entradas/entradas-temporales',
        iconComponent: { name: 'cil-history' },
        priority: 80,
        requiredRoles: [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
        dynamicBadge: {
          service: 'BadgeCounterService',
          method: 'getDraftEntriesCount',
          refreshInterval: 30000
        },
        badge: {
          color: 'warning',
          text: 'Pend'
        }
      },
      {
        name: 'Taxonomía',
        url: '/admin/control/taxonomia',
        iconComponent: { name: 'cil-asterisk' },
        priority: 70,
        requiredRoles: [UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
        children: [
          {
            name: 'Categorías',
            url: '/admin/control/categorias',
            iconComponent: { name: 'cil-spreadsheet' },
            priority: 100,
            requiredRoles: [UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO]
          },
          {
            name: 'Etiquetas',
            url: '/admin/control/etiquetas',
            iconComponent: { name: 'cil-tags' },
            priority: 90,
            requiredRoles: [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO]
          }
        ]
      }
    ]
  },
  {
    name: 'Páginas',
    url: '/admin/control/paginas',
    iconComponent: { name: 'cil-library' },
    priority: 75,
    requiredRoles: [UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
    linkProps: { fragment: 'someAnchor' },
    attributes: { id: 'nav-pages' }
  },
  {
    name: 'Multimedia',
    url: '/admin/control/contenido',
    iconComponent: { name: 'cil-image' },
    priority: 70,
    requiredRoles: [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
    attributes: { id: 'nav-media' },
    children: [
      {
        name: 'Imágenes',
        url: '/admin/control/contenido/imagenes',
        iconComponent: { name: 'cil-image-plus' },
        priority: 100,
        requiredRoles: [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO]
      },
      {
        name: 'Archivos',
        url: '/admin/control/contenido/archivos',
        iconComponent: { name: 'cil-file' },
        priority: 90,
        requiredRoles: [UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO]
      }
    ]
  },
  {
    name: 'Comentarios',
    url: '/admin/control/comentarios',
    iconComponent: { name: 'cil-comment-square' },
    priority: 65,
    requiredRoles: [UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
    linkProps: { fragment: 'listadoComentarios' },
    dynamicBadge: {
      service: 'BadgeCounterService',
      method: 'getUnmoderatedCommentsCount',
      refreshInterval: 15000
    },
    badge: {
      color: 'danger',
      text: 'Pend'
    },
    attributes: { id: 'nav-comments' }
  },

  // User Administration Section
  {
    title: true,
    name: 'Admin. de Usuarios',
    priority: 60,
    requiredRoles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO],
    attributes: { id: 'nav-title-users' }
  },
  {
    name: 'Usuarios',
    url: '/admin/control/gestion/usuarios',
    iconComponent: { name: 'cil-people' },
    priority: 55,
    requiredRoles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO],
    dynamicBadge: {
      service: 'BadgeCounterService',
      method: 'getPendingUsersCount',
      refreshInterval: 60000
    },
    badge: {
      color: 'info',
      text: '+'
    },
    attributes: { id: 'nav-users' }
  },
  {
    name: 'Roles y Permisos',
    url: '/admin/control/gestion/roles',
    iconComponent: { name: 'cil-shield-alt' },
    priority: 50,
    requiredRoles: [UserRole.PROPIETARIO],
    attributes: { id: 'nav-roles' },
    children: [
      {
        name: 'Roles',
        url: '/admin/control/gestion/roles',
        iconComponent: { name: 'cil-lock-locked' },
        priority: 100,
        requiredRoles: [UserRole.PROPIETARIO]
      },
      {
        name: 'Privilegios',
        url: '/admin/control/gestion/privilegios',
        iconComponent: { name: 'cil-check-circle' },
        priority: 90,
        requiredRoles: [UserRole.PROPIETARIO]
      }
    ]
  },

  // User Account Section
  {
    title: true,
    name: 'Mi Cuenta',
    priority: 20
  },
  {
    name: 'Mi Perfil',
    url: '/admin/control/perfil',
    iconComponent: { name: 'cil-user' },
    priority: 15,
    requiredRoles: [UserRole.LECTOR, UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.MANTENIMIENTO, UserRole.PROPIETARIO],
    badge: {
      color: 'info',
      text: 'Yo'
    },
    contextualActions: [
      {
        name: 'Editar Perfil',
        icon: 'cil-pencil',
        action: () => console.log('Editar perfil'),
        tooltip: 'Editar información del perfil'
      }
    ]
  },
  {
    name: 'Cambiar Contraseña',
    url: '/admin/control/gestion/changepassword',
    iconComponent: { name: 'cil-lock-locked' },
    priority: 10,
    requiredRoles: [UserRole.LECTOR, UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.MANTENIMIENTO, UserRole.PROPIETARIO]
  },

  // System Configuration Section
  {
    title: true,
    name: 'Config. del Sistema',
    priority: 40
  },
  {
    name: 'Apariencia',
    url: '/admin/control/configuracion/temas',
    iconComponent: { name: 'cil-paint-bucket' },
    priority: 35,
    requiredRoles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO]
  },
  {
    name: 'Configuración General',
    url: '/admin/control/configuracion/ajustes',
    iconComponent: { name: 'cil-settings' },
    priority: 30,
    requiredRoles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO]
  },
  {
    name: 'Ajustes Avanzados',
    url: '/admin/control/configuracion',
    iconComponent: { name: 'cil-equalizer' },
    priority: 25,
    requiredRoles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO]
  },

  // Maintenance Section (for specific roles only)
  {
    title: true,
    name: 'Mantenimiento',
    priority: 5,
    requiredRoles: [UserRole.MANTENIMIENTO, UserRole.DESARROLLADOR, UserRole.PROPIETARIO]
  },
  {
    name: 'Logs del Sistema',
    url: '/admin/control/mantenimiento/logs',
    iconComponent: { name: 'cil-search' },
    priority: 4,
    requiredRoles: [UserRole.MANTENIMIENTO, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
    dynamicBadge: {
      service: 'BadgeCounterService',
      method: 'getSystemAlertsCount',
      refreshInterval: 120000
    },
    badge: {
      color: 'warning',
      text: '*'
    }
  },
  {
    name: 'Base de Datos',
    url: '/admin/control/mantenimiento/database',
    iconComponent: { name: 'cil-storage' },
    priority: 3,
    requiredRoles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO]
  },
  {
    name: 'Herram. de Desarrollo',
    url: '/admin/control/mantenimiento/dev-tools',
    iconComponent: { name: 'cil-code' },
    priority: 2,
    requiredRoles: [UserRole.DESARROLLADOR, UserRole.PROPIETARIO]
  },

  // Quick Links Section
  {
    title: true,
    name: 'Enlaces Rápidos',
    priority: 1
  },
  {
    name: 'Ver Sitio Web',
    url: '/',
    iconComponent: { name: 'cil-external-link' },
    priority: 1,
    requiredRoles: [UserRole.LECTOR, UserRole.AUTOR, UserRole.EDITOR, UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.MANTENIMIENTO, UserRole.PROPIETARIO],
    attributes: { target: '_blank' }
  }
];
