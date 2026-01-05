import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListadoComentariosComponent } from './comentarios/listado-comentarios.component';
import { CrearComentarioComponent } from './comentarios/crear/crear-comentario.component';
import { EditarComentarioComponent } from './comentarios/editar/editar-comentario.component';
import { BaseComponent } from './base.component';
import { BaseIndexComponent } from './base-index.component';
import { ListadoCategoriasComponent } from './categorias/listado-categorias.component';
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
        loadChildren: () => import('./entradas/entradas.module').then((m) => m.EntradasModule),
        data: { preload: true, delay: 1000, title: 'MENU.ENTRIES' },
      },
      {
        path: 'paginas',
        loadChildren: () => import('./paginas/paginas.module').then((m) => m.PaginasModule),
        data: { preload: true, delay: 1100, title: 'MENU.PAGES' },
      },
      // Secciones reubicadas bajo base
      {
        path: 'configuracion',
        loadChildren: () =>
          import('./configuracion/configuracion.module').then((m) => m.ConfiguracionModule),
        data: { preload: true, delay: 1200, title: 'MENU.SETTINGS' },
      },
      {
        path: 'contenido',
        loadChildren: () => import('./contenido/contenido.module').then((m) => m.ContenidoModule),
        data: { preload: true, delay: 1400, title: 'MENU.CONTENT' },
      },
      {
        path: 'gestion',
        loadChildren: () => import('./gestion/gestion.module').then((m) => m.GestionModule),
        data: { preload: true, delay: 1600, title: 'MENU.MANAGEMENT' },
      },
      {
        path: 'etiquetas',
        loadChildren: () => import('./etiquetas/etiquetas.module').then((m) => m.EtiquetasModule),
        data: { preload: true, delay: 1800, title: 'MENU.TAGS' },
      },
      {
        path: 'perfil',
        loadChildren: () => import('./perfil/perfil.module').then((m) => m.PerfilModule),
        data: { title: 'MENU.PROFILE' },
      },
      {
        path: 'mantenimiento',
        loadChildren: () =>
          import('./mantenimiento/mantenimiento.module').then((m) => m.MantenimientoModule),
        data: { preload: true, delay: 2000, title: 'MENU.MAINTENANCE' },
      },
      {
        path: 'categorias',
        component: ListadoCategoriasComponent,
        data: { title: 'MENU.CATEGORIES' },
      },
      {
        path: 'comentarios',
        data: { title: 'MENU.COMMENTS' },
        children: [
          { path: '', component: ListadoComentariosComponent },
          { path: 'crear', component: CrearComentarioComponent, data: { title: 'MENU.CREATE_COMMENT' } },
          {
            path: 'editar/:idComentario',
            component: EditarComentarioComponent,
            data: { title: 'MENU.EDIT_COMMENT' }
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BaseRoutingModule {}
