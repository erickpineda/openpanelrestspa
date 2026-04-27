import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListadoEntradasComponent } from './listado-entradas.component';
import { CrearEntradaComponent } from './crear/crear-entrada.component';
import { EditarEntradaComponent } from './editar/editar-entrada.component';
import { TemporaryEntriesManagerComponent } from './entradas-temporales/temporary-entries-manager.component';
import { EntradaIdRedirectGuard } from './guards/entrada-id-redirect.guard';
import { UserRole } from '../../../shared/types/navigation.types';

const routes: Routes = [
  {
    path: '',
    component: ListadoEntradasComponent,
    data: {
      roles: [
        UserRole.AUTOR,
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.PROPIETARIO,
      ],
    },
  },
  {
    path: 'crear',
    component: CrearEntradaComponent,
    data: {
      title: 'MENU.CREATE_ENTRY',
      roles: [
        UserRole.AUTOR,
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.PROPIETARIO,
      ],
    },
  },
  {
    path: 'editar/slug/:slug',
    component: EditarEntradaComponent,
    data: {
      title: 'MENU.EDIT_ENTRY',
      roles: [
        UserRole.AUTOR,
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.PROPIETARIO,
      ],
    },
  },
  {
    path: 'editar/:idEntrada',
    component: EditarEntradaComponent,
    canActivate: [EntradaIdRedirectGuard],
    data: {
      title: 'MENU.EDIT_ENTRY',
      roles: [
        UserRole.AUTOR,
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.PROPIETARIO,
      ],
    },
  },
  {
    path: 'entradas-temporales',
    component: TemporaryEntriesManagerComponent,
    data: {
      title: 'MENU.TEMP_ENTRIES',
      roles: [
        UserRole.AUTOR,
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.PROPIETARIO,
      ],
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntradasRoutingModule {}
