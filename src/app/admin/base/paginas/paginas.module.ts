import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { PaginasRoutingModule } from './paginas-routing.module';
import { ListadoPaginasComponent } from './listado-paginas.component';
import { EditarPaginaComponent } from './editar/editar-pagina.component';

import { SharedOPModule } from '../../../shared/shared.module';
import { SharedCoreUiModule } from '../../../shared/shared-coreui.module';
import { SharedWidgetsModule } from '../../../shared/shared-widgets.module';
import { EntradasSharedModule } from '../entradas/entradas-shared.module';
import { CrearPaginaComponent } from './crear/crear-pagina.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginasRoutingModule,
    SharedOPModule,
    SharedWidgetsModule,
    SharedCoreUiModule,
    EntradasSharedModule,
  ],
  declarations: [ListadoPaginasComponent, CrearPaginaComponent, EditarPaginaComponent],
})
export class PaginasModule { }
