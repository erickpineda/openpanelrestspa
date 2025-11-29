import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImagenesComponent } from './imagenes/imagenes.component';
import { ArchivosComponent } from './archivos/archivos.component';
import { EtiquetasListComponent } from './etiquetas/etiquetas-list.component';

const routes: Routes = [
  { path: 'imagenes', component: ImagenesComponent },
  { path: 'archivos', component: ArchivosComponent },
  { path: 'etiquetas', component: EtiquetasListComponent },
  { path: '', redirectTo: 'imagenes', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContenidoRoutingModule { }
