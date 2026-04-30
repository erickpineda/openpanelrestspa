import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListadoEntradasComponent } from './listado-entradas.component';
import { CrearEntradaComponent } from './crear/crear-entrada.component';
import { EditarEntradaComponent } from './editar/editar-entrada.component';
import { TemporaryEntriesManagerComponent } from './entradas-temporales/temporary-entries-manager.component';
import { EntradaIdRedirectGuard } from './guards/entrada-id-redirect.guard';
import { OpPrivilegioConstants } from '../../../shared/constants/op-privilegio.constants';

const routes: Routes = [
  {
    path: '',
    component: ListadoEntradasComponent,
    data: {
      permissions: [
        OpPrivilegioConstants.CREAR_ENTRADAS,
        OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
        OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
      ],
      permissionMode: 'ANY',
    },
  },
  {
    path: 'crear',
    component: CrearEntradaComponent,
    data: {
      title: 'MENU.CREATE_ENTRY',
      permissions: [
        OpPrivilegioConstants.CREAR_ENTRADAS,
        OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
        OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
      ],
      permissionMode: 'ANY',
    },
  },
  {
    path: 'editar/slug/:slug',
    component: EditarEntradaComponent,
    data: {
      title: 'MENU.EDIT_ENTRY',
      permissions: [
        OpPrivilegioConstants.CREAR_ENTRADAS,
        OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
        OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
      ],
      permissionMode: 'ANY',
    },
  },
  {
    path: 'editar/:idEntrada',
    component: EditarEntradaComponent,
    canActivate: [EntradaIdRedirectGuard],
    data: {
      title: 'MENU.EDIT_ENTRY',
      permissions: [
        OpPrivilegioConstants.CREAR_ENTRADAS,
        OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
        OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
      ],
      permissionMode: 'ANY',
    },
  },
  {
    path: 'entradas-temporales',
    component: TemporaryEntriesManagerComponent,
    data: {
      title: 'MENU.TEMP_ENTRIES',
      permissions: [
        OpPrivilegioConstants.CREAR_ENTRADAS,
        OpPrivilegioConstants.EDITAR_ENTRADAS_PROPIAS,
        OpPrivilegioConstants.EDITAR_ENTRADAS_TODO,
      ],
      permissionMode: 'ANY',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntradasRoutingModule {}
