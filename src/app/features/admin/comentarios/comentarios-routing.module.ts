import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListadoComentariosComponent } from './listado-comentarios.component';

const routes: Routes = [{ path: '', component: ListadoComentariosComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComentariosRoutingModule {}
