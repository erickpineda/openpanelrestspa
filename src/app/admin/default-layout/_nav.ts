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
    linkProps: { fragment: 'someAnchor' },
    iconComponent: { name: 'cil-spreadsheet' }
  },
  {
    name: 'Etiquetas',
    url: '/admin/control/etiquetas',
    linkProps: { fragment: 'someAnchor' },
    iconComponent: { name: 'cil-pin' }
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
    children: [
      {
        name: 'Imágenes',
        url: '/admin/contenido/imagenes'
      },
      {
        name: 'Archivos',
        url: '/admin/contenido/archivos'
      },
    ]
  },
  {
    title: true,
    name: 'Gestión'
  },
  {
    name: 'Usuarios',
    iconComponent: { name: 'cil-people' },
    children: [
      {
        name: 'Listar',
        url: '/admin/gestion/usuarios'
      },
      {
        name: 'Mi Perfil',
        url: '/admin/gestion/miperfil'
      },
      {
        name: 'Cambiar contraseña',
        url: '/admin/gestion/changepassword'
      },
    ]
  },
  {
    name: 'Configruración',
    iconComponent: { name: 'cil-cog' },
    children: [
      {
        name: 'Temas',
        url: '/admin/configuracion/temas'
      },
      {
        name: 'Ajustes',
        url: '/admin/configuracion/ajustes'
      },
    ]
  },
];