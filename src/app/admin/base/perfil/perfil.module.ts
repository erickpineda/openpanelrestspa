import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TabsModule } from '@coreui/angular';

import { PerfilRoutingModule } from './perfil-routing.module';
import { PerfilComponent } from './containers/perfil.component';
import { PerfilFormComponent } from './components/perfil-form/perfil-form.component';
import { PerfilPreferencesComponent } from './components/perfil-preferences/perfil-preferences.component';
import { PerfilActivityComponent } from './components/perfil-activity/perfil-activity.component';
import { SharedOPModule } from '../../../shared/shared.module';
import { SharedCoreUiModule } from '../../../shared/shared-coreui.module';

@NgModule({
  declarations: [
    PerfilComponent,
    PerfilFormComponent,
    PerfilPreferencesComponent,
    PerfilActivityComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TabsModule,
    PerfilRoutingModule,
    SharedOPModule,
    SharedCoreUiModule,
  ],
})
export class PerfilModule {}
