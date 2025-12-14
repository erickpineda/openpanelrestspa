import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListadoPaginasComponent } from './listado-paginas.component';
import { EditarPaginaComponent } from './editar/editar-pagina.component';
import { CrearPaginaComponent } from './crear/crear-pagina.component';

const routes: Routes = [
  { path: '', component: ListadoPaginasComponent },
  { path: 'crear', component: CrearPaginaComponent },
  { path: 'editar/:idEntrada', component: EditarPaginaComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaginasRoutingModule {}
