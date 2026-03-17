import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './base.component';
import { BaseIndexComponent } from './base-index.component';
// Entradas feature is lazy-loaded (EntradasModule)

const routes: Routes = [
  {
    path: '',
    component: BaseComponent,
    children: [
      {
        path: '',
        component: BaseIndexComponent,
        data: { title: 'MENU.MAIN_PANEL' },
      },
      {
        path: 'entradas',
        loadChildren: () =>
          import('@features/admin/entradas/entradas.module').then((m) => m.EntradasModule),
        data: { preload: true, delay: 3000, title: 'MENU.ENTRIES' },
      },
      {
        path: 'paginas',
        loadChildren: () =>
          import('@features/admin/paginas/paginas.module').then((m) => m.PaginasFeatureModule),
        data: { preload: true, delay: 4000, title: 'MENU.PAGES' },
      },
      // Secciones reubicadas bajo base
      {
        path: 'configuracion',
        loadChildren: () =>
          import('@features/admin/configuracion/configuracion.module').then(
            (m) => m.ConfiguracionFeatureModule
          ),
        data: { preload: true, delay: 8000, title: 'MENU.SETTINGS' },
      },
      {
        path: 'contenido',
        loadChildren: () =>
          import('@features/admin/contenido/contenido.module').then(
            (m) => m.ContenidoFeatureModule
          ),
        data: { preload: true, delay: 5000, title: 'MENU.CONTENT' },
      },
      {
        path: 'gestion',
        loadChildren: () =>
          import('@features/admin/gestion/gestion.module').then((m) => m.GestionFeatureModule),
        data: { preload: true, delay: 6000, title: 'MENU.MANAGEMENT' },
      },
      {
        path: 'etiquetas',
        loadChildren: () =>
          import('@features/admin/etiquetas/etiquetas.module').then(
            (m) => m.EtiquetasFeatureModule
          ),
        data: { preload: true, delay: 7000, title: 'MENU.TAGS' },
      },
      {
        path: 'perfil',
        loadChildren: () =>
          import('@features/admin/perfil/perfil.module').then((m) => m.PerfilFeatureModule),
        data: { title: 'MENU.PROFILE' }, // No preload
      },
      {
        path: 'mantenimiento',
        loadChildren: () =>
          import('@features/admin/mantenimiento/mantenimiento.module').then(
            (m) => m.MantenimientoFeatureModule
          ),
        data: { title: 'MENU.MAINTENANCE' }, // No preload
      },
      {
        path: 'categorias',
        loadChildren: () =>
          import('@features/admin/categorias/categorias.module').then(
            (m) => m.CategoriasFeatureModule
          ),
        data: { preload: true, delay: 7500, title: 'MENU.CATEGORIES' },
      },
      {
        path: 'comentarios',
        loadChildren: () =>
          import('@features/admin/comentarios/comentarios.module').then(
            (m) => m.ComentariosFeatureModule
          ),
        data: { preload: true, delay: 6500, title: 'MENU.COMMENTS' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BaseRoutingModule {}
