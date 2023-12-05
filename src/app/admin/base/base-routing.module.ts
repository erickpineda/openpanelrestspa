import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VerEditarEntrada } from './entradas/components/ver-editar/ver-editar-entrada.component';
import { ListadoEntradasComponent } from './entradas/containers/listado-entradas.component';


const routes: Routes = [
  { path: '', redirectTo: 'entradas', pathMatch: 'full' },
  {
    path: 'entradas', children: [
      { path: '', component: ListadoEntradasComponent },
      { path: ':idEntrada', component: VerEditarEntrada },
      { path: 'crear', component: VerEditarEntrada },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BaseRoutingModule { }