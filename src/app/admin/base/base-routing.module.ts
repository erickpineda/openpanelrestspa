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
        data: { title: 'Panel Principal' },
      },
      {
        path: 'entradas',
        loadChildren: () => import('./entradas/entradas.module').then((m) => m.EntradasModule),
        data: { preload: true, delay: 1000 },
      },
      {
        path: 'paginas',
        loadChildren: () => import('./paginas/paginas.module').then((m) => m.PaginasModule),
        data: { preload: true, delay: 1100 },
      },
      // Secciones reubicadas bajo base
      {
        path: 'configuracion',
        loadChildren: () =>
          import('./configuracion/configuracion.module').then((m) => m.ConfiguracionModule),
        data: { preload: true, delay: 1200 },
      },
      {
        path: 'contenido',
        loadChildren: () => import('./contenido/contenido.module').then((m) => m.ContenidoModule),
        data: { preload: true, delay: 1400 },
      },
      {
        path: 'gestion',
        loadChildren: () => import('./gestion/gestion.module').then((m) => m.GestionModule),
        data: { preload: true, delay: 1600 },
      },
      {
        path: 'etiquetas',
        loadChildren: () => import('./etiquetas/etiquetas.module').then((m) => m.EtiquetasModule),
        data: { preload: true, delay: 1800 },
      },
      {
        path: 'perfil',
        loadChildren: () => import('./perfil/perfil.module').then((m) => m.PerfilModule),
      },
      {
        path: 'mantenimiento',
        loadChildren: () =>
          import('./mantenimiento/mantenimiento.module').then((m) => m.MantenimientoModule),
        data: { preload: true, delay: 2000 },
      },
      {
        path: 'categorias',
        component: ListadoCategoriasComponent,
      },
      {
        path: 'comentarios',
        children: [
          { path: '', component: ListadoComentariosComponent },
          { path: 'crear', component: CrearComentarioComponent },
          {
            path: 'editar/:idComentario',
            component: EditarComentarioComponent,
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
