import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PerfilComponent } from './containers/perfil.component';
import { UserRole } from '../../../shared/types/navigation.types';

const routes: Routes = [
  {
    path: '',
    component: PerfilComponent,
    data: {
      roles: [
        UserRole.LECTOR,
        UserRole.AUTOR,
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.MANTENIMIENTO,
        UserRole.PROPIETARIO,
      ],
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PerfilFeatureRoutingModule {}
