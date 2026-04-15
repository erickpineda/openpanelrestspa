import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedOPModule } from '@shared/shared.module';
import { SharedWidgetsModule } from '@shared/shared-widgets.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { ConfiguracionFeatureRoutingModule } from './configuracion-routing.module';
import { TemasComponent } from './temas/temas.component';
import { AjustesComponent } from './ajustes/ajustes.component';
import { TemaStudioComponent } from './temas/studio/tema-studio.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedOPModule,
    SharedWidgetsModule,
    SharedCoreUiModule,
    ConfiguracionFeatureRoutingModule,
  ],
  declarations: [TemasComponent, AjustesComponent, TemaStudioComponent],
})
export class ConfiguracionFeatureModule {}
