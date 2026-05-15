import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EtiquetasListComponent } from './listado-etiquetas.component';
import { OpPrivilegioConstants } from '../../../shared/constants/op-privilegio.constants';

const routes: Routes = [
  {
    path: '',
    component: EtiquetasListComponent,
    data: {
      permissions: [OpPrivilegioConstants.GESTIONAR_ETIQUETAS],
      permissionMode: 'ANY',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EtiquetasFeatureRoutingModule {}
