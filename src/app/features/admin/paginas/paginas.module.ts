import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { SharedWidgetsModule } from '@shared/shared-widgets.module';
import { EntradasSharedModule } from '@features/admin/entradas/entradas-shared.module';
import { PaginasFeatureRoutingModule } from './paginas-routing.module';
import { ListadoPaginasComponent } from './listado-paginas.component';
import { EditarPaginaComponent } from './editar/editar-pagina.component';
import { CrearPaginaComponent } from './crear/crear-pagina.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SharedOPModule,
    SharedCoreUiModule,
    SharedWidgetsModule,
    EntradasSharedModule,
    PaginasFeatureRoutingModule,
  ],
  declarations: [ListadoPaginasComponent, CrearPaginaComponent, EditarPaginaComponent],
})
export class PaginasFeatureModule {}
