import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArchivosComponent } from './archivos/archivos.component';
import { ImagenesComponent } from './imagenes/imagenes.component';
import { UserRole } from '../../../shared/types/navigation.types';

const routes: Routes = [
  {
    path: 'archivos',
    component: ArchivosComponent,
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
    path: 'imagenes',
    component: ImagenesComponent,
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
  { path: '', redirectTo: 'archivos', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContenidoFeatureRoutingModule {}
