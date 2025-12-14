import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListadoPaginasComponent } from './listado-paginas.component';

const routes: Routes = [
  { path: '', component: ListadoPaginasComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaginasRoutingModule {}
