import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedOPModule } from '@shared/shared.module';
import { MantenimientoFeatureRoutingModule } from './mantenimiento-routing.module';
import { LogsComponent } from './logs/logs.component';
import { DatabaseComponent } from './database/database.component';
import { DevToolsComponent } from './dev-tools/dev-tools.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedOPModule,
    MantenimientoFeatureRoutingModule,
  ],
  declarations: [LogsComponent, DatabaseComponent, DevToolsComponent],
})
export class MantenimientoFeatureModule {}
