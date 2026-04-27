import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EtiquetasListComponent } from './listado-etiquetas.component';
import { UserRole } from '../../../shared/types/navigation.types';

const routes: Routes = [
  {
    path: '',
    component: EtiquetasListComponent,
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EtiquetasFeatureRoutingModule {}
