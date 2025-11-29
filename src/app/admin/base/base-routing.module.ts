import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListadoComentariosComponent } from './comentarios/listado-comentarios.component';
import { CrearEditarComentario } from './comentarios/crear-editar/crear-editar-comentario.component';
import { BaseComponent } from './base.component';
import { CrearCategoriaComponent } from './categorias/crear/crear-categoria.component';
import { EditarCategoriaComponent } from './categorias/editar/editar-categoria.component';
import { ListadoCategoriasComponent } from './categorias/listado-categorias.component';
// Entradas feature is lazy-loaded (EntradasModule)


const routes: Routes = [
  {
    path: '', component: BaseComponent, children: [
      { path: 'entradas', loadChildren: () => import('./entradas/entradas.module').then(m => m.EntradasModule) },
      // Secciones reubicadas bajo base
      { path: 'configuracion', loadChildren: () => import('./configuracion/configuracion.module').then(m => m.ConfiguracionModule) },
      { path: 'contenido', loadChildren: () => import('./contenido/contenido.module').then(m => m.ContenidoModule) },
      { path: 'gestion', loadChildren: () => import('./gestion/gestion.module').then(m => m.GestionModule) },
      {
        path: 'categorias', children: [
          { path: '', component: ListadoCategoriasComponent },
          { path: 'crear', component: CrearCategoriaComponent },
          { path: 'editar/:idCategoria', component: EditarCategoriaComponent },
        ]
      },
      {
        path: 'comentarios', children: [
          { path: '', component: ListadoComentariosComponent },
          { path: ':idComentario', component: CrearEditarComentario },
          { path: 'crear', component: CrearEditarComentario },
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BaseRoutingModule { }
