import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './base.component';
import { BaseIndexComponent } from './base-index.component';
// Entradas feature is lazy-loaded (EntradasModule)
import { OpPrivilegioConstants } from '../../shared/constants/op-privilegio.constants';
import { UserRole } from '../../shared/types/navigation.types';

export const baseRoutes: Routes = [
  {
    path: '',
    component: BaseComponent,
    children: [
      {
        path: '',
        component: BaseIndexComponent,
        data: {
          title: 'MENU.MAIN_PANEL',
        },
      },
      {
        path: 'entradas',
        loadChildren: () =>
          import('@features/admin/entradas/entradas.module').then((m) => m.EntradasModule),
        data: {
          preload: true,
          delay: 3000,
          title: 'MENU.ENTRIES',
          permissions: [
            OpPrivilegioConstants.CREAR_ENTRADAS,
            OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
            OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
          ],
          permissionMode: 'ANY',
          roles: [
            UserRole.AUTOR,
            UserRole.EDITOR,
            UserRole.ADMINISTRADOR,
            UserRole.DESARROLLADOR,
            UserRole.PROPIETARIO,
          ],
        },
      },
      {
        path: 'paginas',
        loadChildren: () =>
          import('@features/admin/paginas/paginas.module').then((m) => m.PaginasFeatureModule),
        data: {
          preload: true,
          delay: 4000,
          title: 'MENU.PAGES',
          permissions: [OpPrivilegioConstants.GESTIONAR_PAGINAS],
          permissionMode: 'ANY',
        },
      },
      // Secciones reubicadas bajo base
      {
        path: 'configuracion',
        loadChildren: () =>
          import('@features/admin/configuracion/configuracion.module').then(
            (m) => m.ConfiguracionFeatureModule
          ),
        data: {
          preload: true,
          delay: 8000,
          title: 'MENU.SETTINGS',
          permissions: [
            OpPrivilegioConstants.GESTIONAR_AJUSTES_SISTEMA,
            OpPrivilegioConstants.GESTIONAR_TEMAS,
            OpPrivilegioConstants.CONFIGURAR_SISTEMA,
          ],
          permissionMode: 'ANY',
          roles: [UserRole.ADMINISTRADOR, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
        },
      },
      {
        path: 'contenido',
        loadChildren: () =>
          import('@features/admin/contenido/contenido.module').then(
            (m) => m.ContenidoFeatureModule
          ),
        data: {
          preload: true,
          delay: 5000,
          title: 'MENU.CONTENT',
          permissions: [OpPrivilegioConstants.GESTIONAR_ARCHIVOS],
          permissionMode: 'ANY',
          roles: [
            UserRole.AUTOR,
            UserRole.EDITOR,
            UserRole.ADMINISTRADOR,
            UserRole.DESARROLLADOR,
            UserRole.PROPIETARIO,
          ],
        },
      },
      {
        path: 'gestion',
        loadChildren: () =>
          import('@features/admin/gestion/gestion.module').then((m) => m.GestionFeatureModule),
        data: {
          preload: true,
          delay: 6000,
          title: 'MENU.MANAGEMENT',
          permissions: [
            OpPrivilegioConstants.GESTIONAR_USUARIOS,
            OpPrivilegioConstants.GESTIONAR_ROLES,
            OpPrivilegioConstants.GESTIONAR_ROLES_USUARIOS,
            OpPrivilegioConstants.GESTIONAR_PRIVILEGIOS,
          ],
          permissionMode: 'ANY',
          roles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO],
        },
      },
      {
        path: 'etiquetas',
        loadChildren: () =>
          import('@features/admin/etiquetas/etiquetas.module').then(
            (m) => m.EtiquetasFeatureModule
          ),
        data: {
          preload: true,
          delay: 7000,
          title: 'MENU.TAGS',
          permissions: [OpPrivilegioConstants.GESTIONAR_ETIQUETAS],
          permissionMode: 'ANY',
        },
      },
      {
        path: 'perfil',
        loadChildren: () =>
          import('@features/admin/perfil/perfil.module').then((m) => m.PerfilFeatureModule),
        data: {
          title: 'MENU.PROFILE',
          permissions: [
            OpPrivilegioConstants.GESTIONAR_PERFIL_PROPIO,
            OpPrivilegioConstants.GESTIONAR_PERFIL,
          ],
          permissionMode: 'ANY',
        }, // No preload
      },
      {
        path: 'mantenimiento',
        loadChildren: () =>
          import('@features/admin/mantenimiento/mantenimiento.module').then(
            (m) => m.MantenimientoFeatureModule
          ),
        data: {
          title: 'MENU.MAINTENANCE',
          permissions: [
            OpPrivilegioConstants.REALIZAR_MANTENIMIENTO,
            OpPrivilegioConstants.DEPURAR_ERRORES,
          ],
          permissionMode: 'ANY',
          roles: [UserRole.MANTENIMIENTO, UserRole.DESARROLLADOR, UserRole.PROPIETARIO],
        }, // No preload
      },
      {
        path: 'categorias',
        loadChildren: () =>
          import('@features/admin/categorias/categorias.module').then(
            (m) => m.CategoriasFeatureModule
          ),
        data: {
          preload: true,
          delay: 7500,
          title: 'MENU.CATEGORIES',
          permissions: [OpPrivilegioConstants.GESTIONAR_CATEGORIAS],
          permissionMode: 'ANY',
        },
      },
      {
        path: 'comentarios',
        loadChildren: () =>
          import('@features/admin/comentarios/comentarios.module').then(
            (m) => m.ComentariosFeatureModule
          ),
        data: {
          preload: true,
          delay: 6500,
          title: 'MENU.COMMENTS',
          permissions: [
            OpPrivilegioConstants.APROBAR_COMENTARIOS,
            OpPrivilegioConstants.OCULTAR_COMENTARIOS,
            OpPrivilegioConstants.BORRAR_COMENTARIOS_TODO,
            OpPrivilegioConstants.BORRAR_COMENTARIOS,
            OpPrivilegioConstants.MODERAR_COMENTARIOS,
          ],
          permissionMode: 'ANY',
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(baseRoutes)],
  exports: [RouterModule],
})
export class BaseRoutingModule {}
