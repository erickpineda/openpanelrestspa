import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArchivosComponent } from './archivos/archivos.component';
import { ImagenesComponent } from './imagenes/imagenes.component';

const routes: Routes = [
  { path: 'archivos', component: ArchivosComponent },
  { path: 'imagenes', component: ImagenesComponent },
  { path: '', redirectTo: 'archivos', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContenidoFeatureRoutingModule {}
