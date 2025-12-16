import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PerfilComponent } from './containers/perfil.component';

const routes: Routes = [
  {
    path: '',
    component: PerfilComponent,
    data: {
      title: 'Perfil de Usuario'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PerfilRoutingModule { }
