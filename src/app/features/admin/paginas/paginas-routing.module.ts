import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaginaIdRedirectGuard } from './guards/pagina-id-redirect.guard';
import { ListadoPaginasComponent } from './listado-paginas.component';
import { EditarPaginaComponent } from './editar/editar-pagina.component';
import { CrearPaginaComponent } from './crear/crear-pagina.component';
import { OpPrivilegioConstants } from '../../../shared/constants/op-privilegio.constants';

const routes: Routes = [
  {
    path: '',
    component: ListadoPaginasComponent,
    data: {
      permissions: [OpPrivilegioConstants.GESTIONAR_PAGINAS],
      permissionMode: 'ANY',
    },
  },
  {
    path: 'crear',
    component: CrearPaginaComponent,
    data: {
      title: 'MENU.CREATE_PAGE',
      permissions: [OpPrivilegioConstants.GESTIONAR_PAGINAS],
      permissionMode: 'ANY',
    },
  },
  {
    path: 'editar/slug/:slug',
    component: EditarPaginaComponent,
    data: {
      title: 'MENU.EDIT_PAGE',
      permissions: [OpPrivilegioConstants.GESTIONAR_PAGINAS],
      permissionMode: 'ANY',
    },
  },
  {
    path: 'editar/:idEntrada',
    component: EditarPaginaComponent,
    canActivate: [PaginaIdRedirectGuard],
    data: {
      title: 'MENU.EDIT_PAGE',
      permissions: [OpPrivilegioConstants.GESTIONAR_PAGINAS],
      permissionMode: 'ANY',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PaginasFeatureRoutingModule {}
