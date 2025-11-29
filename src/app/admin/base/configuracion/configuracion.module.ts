import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionRoutingModule } from './configuracion-routing.module';
import { TemasComponent } from './temas/temas.component';
import { AjustesComponent } from './ajustes/ajustes.component';
import { IconModule } from '@coreui/icons-angular';

@NgModule({
  declarations: [TemasComponent, AjustesComponent],
  imports: [CommonModule, ConfiguracionRoutingModule, IconModule]
})
export class ConfiguracionModule {}
