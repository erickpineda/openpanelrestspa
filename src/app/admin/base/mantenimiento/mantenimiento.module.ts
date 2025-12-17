import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedOPModule } from '../../../shared/shared.module';
import { MantenimientoRoutingModule } from './mantenimiento-routing.module';
import { LogsComponent } from './logs/logs.component';
import { DatabaseComponent } from './database/database.component';
import { DevToolsComponent } from './dev-tools/dev-tools.component';

@NgModule({
  declarations: [
    LogsComponent,
    DatabaseComponent,
    DevToolsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedOPModule,
    MantenimientoRoutingModule
  ]
})
export class MantenimientoModule {}
