import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionRoutingModule } from './configuracion-routing.module';
import { TemasComponent } from './temas/temas.component';
import { AjustesComponent } from './ajustes/ajustes.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedOPModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [TemasComponent, AjustesComponent],
  imports: [
    CommonModule,
    ConfiguracionRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedOPModule,
  ],
})
export class ConfiguracionModule {}
