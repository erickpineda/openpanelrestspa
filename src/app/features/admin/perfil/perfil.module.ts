import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TabsModule } from '@coreui/angular';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { PerfilFeatureRoutingModule } from './perfil-routing.module';
import { PerfilComponent } from './containers/perfil.component';
import { PerfilFormComponent } from './components/perfil-form/perfil-form.component';
import { PerfilPreferencesComponent } from './components/perfil-preferences/perfil-preferences.component';
import { PerfilActivityComponent } from './components/perfil-activity/perfil-activity.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TabsModule,
    SharedOPModule,
    SharedCoreUiModule,
    PerfilFeatureRoutingModule,
  ],
  declarations: [
    PerfilComponent,
    PerfilFormComponent,
    PerfilPreferencesComponent,
    PerfilActivityComponent,
  ],
})
export class PerfilFeatureModule {}
