import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListadoEntradasComponent } from './entradas/listado-entradas.component';
import { ListadoComentariosComponent } from './comentarios/listado-comentarios.component';
import { CrearEditarComentario } from './comentarios/crear-editar/crear-editar-comentario.component';
import { BaseComponent } from './base.component';
import { CrearCategoriaComponent } from './categorias/crear/crear-categoria.component';
import { EditarCategoriaComponent } from './categorias/editar/editar-categoria.component';
import { ListadoCategoriasComponent } from './categorias/listado-categorias.component';
import { CrearEntradaComponent } from './entradas/crear/crear-entrada.component';
import { EditarEntradaComponent } from './entradas/editar/editar-entrada.component';
import { TemporaryEntriesManagerComponent } from '../../shared/components/temporary-entries-manager/temporary-entries-manager.component';


const routes: Routes = [
  {
    path: '', component: BaseComponent, children: [
      {
        path: 'entradas', children: [
          { path: '', component: ListadoEntradasComponent },
          { path: 'crear', component: CrearEntradaComponent },
          { path: 'editar/:idEntrada', component: EditarEntradaComponent },
          { path: 'entradas-temporales', component: TemporaryEntriesManagerComponent },
        ]
      },
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