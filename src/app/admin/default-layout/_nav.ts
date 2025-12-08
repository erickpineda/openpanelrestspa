import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Escritorio',
    url: '/admin/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    badge: {
      color: 'info',
      text: 'Nuevo'
    }
  },
  {
    title: true,
    name: 'Gestión de Contenidos'
  },
  {
    name: 'Entradas',
    url: '/admin/control/entradas',
    iconComponent: { name: 'cil-pencil' },
    children: [
      {
        name: 'Listar',
        url: '/admin/control/entradas',
        icon: 'cil-list',
      },
      {
        name: 'Entradas Temporales',
        url: '/admin/control/entradas/entradas-temporales',
        icon: 'cil-history',
        badge: {
          color: 'warning',
          text: '!'
        }
      },
      {
        name: 'Categorías',
        url: '/admin/control/categorias',
        icon: 'cil-spreadsheet'
      },
      {
        name: 'Etiquetas',
        url: '/admin/control/etiquetas',
        icon: 'cil-tags'
      }
    ]
  },
  {
    name: 'Páginas',
    url: '/admin/control/paginas',
    linkProps: { fragment: 'someAnchor' },
    iconComponent: { name: 'cil-library' }
  },
  {
    name: 'Multimedia',
    iconComponent: { name: 'cil-image' },
    children: [
      {
        name: 'Imágenes',
        url: '/admin/control/contenido/imagenes',
        icon: 'cil-image-plus'
      },
      {
        name: 'Archivos',
        url: '/admin/control/contenido/archivos',
        icon: 'cil-file'
      },
    ]
  },
  {
    name: 'Comentarios',
    url: '/admin/control/comentarios',
    linkProps: { fragment: 'listadoComentarios' },
    iconComponent: { name: 'cil-comment-square' }
  },
  {
    title: true,
    name: 'Administración'
  },
  {
    name: 'Control de Acceso',
    iconComponent: { name: 'cil-shield-alt' },
    url: '/admin/control/gestion',
    children: [
      {
        name: 'Usuarios',
        url: '/admin/control/gestion/usuarios',
        icon: 'cil-people'
      },
      {
        name: 'Roles y Privilegios',
        url: '/admin/control/gestion/roles',
        icon: 'cil-lock-locked'
      }
    ]
  },
  {
    name: 'Configuración',
    iconComponent: { name: 'cil-settings' },
    url: '/admin/control/configuracion',
    children: [
      {
        name: 'Temas',
        url: '/admin/control/configuracion/temas',
        icon: 'cil-paint-bucket'
      },
      {
        name: 'Ajustes',
        url: '/admin/control/configuracion/ajustes',
        icon: 'cil-equalizer'
      },
    ]
  },
  {
    title: true,
    name: 'Mi Cuenta'
  },
  {
    name: 'Mi Perfil',
    url: '/admin/control/gestion/miperfil',
    iconComponent: { name: 'cil-user' }
  },
  {
    name: 'Cambiar contraseña',
    url: '/admin/control/gestion/changepassword',
    iconComponent: { name: 'cil-lock-locked' }
  }
];
