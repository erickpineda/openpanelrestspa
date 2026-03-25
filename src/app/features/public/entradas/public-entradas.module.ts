import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListadoEntradasPublicComponent } from './containers/listado-entradas-public/listado-entradas-public.component';
import { DetalleEntradaPublicComponent } from './containers/detalle-entrada-public/detalle-entrada-public.component';
import { SharedOPModule } from '@app/shared/shared.module';
import { SharedCoreUiModule } from '@app/shared/shared-coreui.module';

const routes: Routes = [
  { path: '', component: ListadoEntradasPublicComponent },
  { path: ':slug', component: DetalleEntradaPublicComponent },
];

@NgModule({
  declarations: [
    ListadoEntradasPublicComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedOPModule,
    SharedCoreUiModule,
    DetalleEntradaPublicComponent,
  ],
})
export class PublicEntradasModule {}
