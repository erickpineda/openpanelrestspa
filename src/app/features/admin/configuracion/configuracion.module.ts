import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedOPModule } from '@shared/shared.module';
import { ConfiguracionFeatureRoutingModule } from './configuracion-routing.module';
import { TemasComponent } from './temas/temas.component';
import { AjustesComponent } from './ajustes/ajustes.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedOPModule,
    ConfiguracionFeatureRoutingModule,
  ],
  declarations: [TemasComponent, AjustesComponent],
})
export class ConfiguracionFeatureModule {}
