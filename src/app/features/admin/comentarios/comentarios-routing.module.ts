import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListadoComentariosComponent } from './listado-comentarios.component';
import { OpPrivilegioConstants } from '../../../shared/constants/op-privilegio.constants';

export const comentariosRoutes: Routes = [
  {
    path: '',
    component: ListadoComentariosComponent,
    data: {
      permissions: [
        OpPrivilegioConstants.APROBAR_COMENTARIOS,
        OpPrivilegioConstants.OCULTAR_COMENTARIOS,
        OpPrivilegioConstants.BORRAR_COMENTARIOS_TODO,
        OpPrivilegioConstants.BORRAR_COMENTARIOS,
        OpPrivilegioConstants.MODERAR_COMENTARIOS,
      ],
      permissionMode: 'ANY',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(comentariosRoutes)],
  exports: [RouterModule],
})
export class ComentariosRoutingModule {}
