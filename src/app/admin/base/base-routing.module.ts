import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CrearEditarEntrada } from './entradas/crear-editar/crear-editar-entrada.component';
import { ListadoEntradasComponent } from './entradas/listado-entradas.component';
import { ListadoComentariosComponent } from './comentarios/listado-comentarios.component';
import { CrearEditarComentario } from './comentarios/crear-editar/crear-editar-comentario.component';


const routes: Routes = [
  { path: '', redirectTo: 'entradas', pathMatch: 'full' },
  {
    path: 'entradas', children: [
      { path: '', component: ListadoEntradasComponent },
      { path: ':idEntrada', component: CrearEditarEntrada },
      { path: 'crear', component: CrearEditarEntrada },
    ]
  },
  { path: '', redirectTo: 'comentarios', pathMatch: 'full' },
  {
    path: 'comentarios', children: [
      { path: '', component: ListadoComentariosComponent },
      { path: ':idComentario', component: CrearEditarComentario },
      { path: 'crear', component: CrearEditarComentario },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BaseRoutingModule { }