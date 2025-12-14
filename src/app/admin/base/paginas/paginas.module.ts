import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaginasRoutingModule } from './paginas-routing.module';
import { ListadoPaginasComponent } from './listado-paginas.component';
import { SharedOPModule } from '../../../shared/shared.module';
import { SharedCoreUiModule } from '../../../shared/shared-coreui.module';

@NgModule({
  declarations: [
    ListadoPaginasComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginasRoutingModule,
    SharedOPModule,
    SharedCoreUiModule
  ]
})
export class PaginasModule { }
