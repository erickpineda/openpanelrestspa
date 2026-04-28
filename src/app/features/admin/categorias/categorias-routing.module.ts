import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListadoCategoriasComponent } from './listado-categorias.component';
import { UserRole } from '../../../shared/types/navigation.types';

const routes: Routes = [
  {
    path: '',
    component: ListadoCategoriasComponent,
    data: {
      roles: [
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
export class CategoriasRoutingModule {}
