import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EtiquetasListComponent } from './listado-etiquetas.component';

const routes: Routes = [{ path: '', component: EtiquetasListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EtiquetasRoutingModule {}
