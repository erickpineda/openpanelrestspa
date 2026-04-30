import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListadoCategoriasComponent } from './listado-categorias.component';
import { OpPrivilegioConstants } from '../../../shared/constants/op-privilegio.constants';

const routes: Routes = [
  {
    path: '',
    component: ListadoCategoriasComponent,
    data: {
      permissions: [OpPrivilegioConstants.GESTIONAR_CATEGORIAS],
      permissionMode: 'ANY',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CategoriasRoutingModule {}
