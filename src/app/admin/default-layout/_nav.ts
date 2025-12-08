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
    name: 'WEB'
  },
  {
    name: 'Entradas',
    iconComponent: { name: 'cil-pencil' },
    url: '/admin/control/entradas',
    children: [
      {
        name: 'Listar',
        url: '/admin/control/entradas',
        icon: 'cil-save',
        badge: {
          color: 'warning',
          text: ''
        }
      },
      // ✅ NUEVO: Enlace al gestor de entradas temporales
      {
        name: 'Entradas Temporales',
        url: '/admin/control/entradas/entradas-temporales',
        icon: 'cil-save',
        badge: {
          color: 'warning',
          text: '!' // Se podría hacer dinámico mostrando el count
        }
      },
    ]
  },
  {
    name: 'Páginas',
    url: '/admin/control/paginas',
    linkProps: { fragment: 'someAnchor' },
    iconComponent: { name: 'cil-library' }
  },
  {
    name: 'Categorías',
    url: '/admin/control/categorias',
    linkProps: { fragment: '' },
    iconComponent: { name: 'cil-spreadsheet' }
  },
  {
    name: 'Comentarios',
    url: '/admin/control/comentarios',
    linkProps: { fragment: 'listadoComentarios' },
    iconComponent: { name: 'cil-comment-square' }
  },
  {
    name: 'Contenido',
    title: true
  },
  {
    name: 'Multimedia',
    iconComponent: { name: 'cil-puzzle' },
    url: '/admin/control/contenido/imagenes',
    children: [
      {
        name: 'Imágenes',
        url: '/admin/control/contenido/imagenes'
      },
      {
        name: 'Archivos',
        url: '/admin/control/contenido/archivos'
      },
    ]
  },
  {
    name: 'Etiquetas',
    url: '/admin/control/etiquetas',
    iconComponent: { name: 'cil-pin' }
  },
  {
    title: true,
    name: 'Gestión'
  },
  {
    name: 'Usuarios',
    iconComponent: { name: 'cil-people' },
    url: '/admin/control/gestion/usuarios',
    children: [
      {
        name: 'Listar',
        url: '/admin/control/gestion/usuarios'
      },
      {
        name: 'Mi Perfil',
        url: '/admin/control/gestion/miperfil'
      },
      {
        name: 'Cambiar contraseña',
        url: '/admin/control/gestion/changepassword'
      },
    ]
  },
  {
    name: 'Roles',
    iconComponent: { name: 'cil-lock-locked' },
    url: '/admin/control/gestion/roles'
  },
  {
    name: 'Configruración',
    iconComponent: { name: 'cil-cog' },
    url: '/admin/control/configuracion/temas',
    children: [
      {
        name: 'Temas',
        url: '/admin/control/configuracion/temas'
      },
      {
        name: 'Ajustes',
        url: '/admin/control/configuracion/ajustes'
      },
    ]
  },
];
